import React, { useState, useEffect } from 'react';
import { FormControl } from 'baseui/form-control';
import { validate as validateEmail } from 'email-validator';
import { useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import Input from 'components/input';
import Button from 'components/button';
import ErrorMessage from 'components/errorMessage';

import s from './styles.module.scss';

const REGISTER = gql`
  mutation reg(
    $email: String!
    $name: String!
    $password: String!
  ) {
    register(
      email: $email
      name: $name
      password: $password
    ) {
      _id
      name
      email
      token
    }
  }
`;

const Register = ({ history }) => {
  const [register, { data, error, loading }] = useMutation(REGISTER);

  const [value, setValue] = useState({
    email: '',
    name: '',
    password: '',
  });

  const [isValid, setValid] = useState({
    email: true,
    name: true,
    password: true,
  });

  const onSubmit = () => {
    const valid = {
      email: validateEmail(value.email),
      name: value.name.length >= 2,
      password: value.password.length >= 4,
    }

    setValid(valid)

    let allValid = true;

    for (let key in valid) {
      if (valid[key] === false) {
        allValid = false;
        break;
      }
    }

    if (allValid) register({ variables: {
      email: value.email,
      name: value.name,
      password: value.password,
    }}).catch(() => null)
  }

  useEffect(() => {
    if (data && data.register && data.register.token) {
      localStorage.token = data.register.token;
      localStorage.email = data.register.email;
    
      history.push('/');
    };
  }, [data])

  useEffect(() => {
    document.title = 'Registration | console.blog'
  }, [])

  return (
    <>
      <form className={s.form} onSubmit={(e) => {
        e.preventDefault();
        onSubmit()
      }}>
        <FormControl
          label='Email'
        >
          <Input 
            value={value.email}
            onChange={e => setValue({...value, email: e.target.value})}
            error={!isValid.email}
          />
        </FormControl>
        <FormControl
          label='Name'
        >
          <Input 
            value={value.name}
            onChange={e => setValue({...value, name: e.target.value})}
            error={!isValid.name}
          />
        </FormControl>
        <FormControl
          label='Password'
        >
          <Input 
            value={value.password}
            onChange={e => setValue({...value, password: e.target.value})}
            error={!isValid.password}
            type='password' 
          />
        </FormControl>
        <Button type='submit' isLoading={loading}>Register</Button>
      </form>
      <ErrorMessage error={error} />
    </>
  )
}

export default Register;
