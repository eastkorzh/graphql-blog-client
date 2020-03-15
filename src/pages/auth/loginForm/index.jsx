import React, { useState, useEffect } from 'react';
import { FormControl } from 'baseui/form-control';
import { validate as validateEmail } from 'email-validator';
import { useLazyQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import Input from 'components/input';
import Button from 'components/button';
import ErrorMessage from 'components/errorMessage';

const LOGIN = gql`
  query Login(
    $email: String!
    $password: String!
  ) {
    login(
      email: $email
      password: $password
    ){
      _id
      token
      email
      name
      avatar
    }
  }
`

const LoginForm = ({ history }) => {
  const [login, { data, error, loading }] = useLazyQuery(LOGIN);

  const [value, setValue] = useState({
    email: localStorage.email || '',
    password: '',
  });

  const [isValid, setValid] = useState({
    email: true,
    password: true,
  });

  const onSubmit = () => {
    const valid = {
      email: validateEmail(value.email),
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

    if (allValid) login({ variables: {
      email: value.email,
      password: value.password,
    }})
  }

  useEffect(() => {
    if (data && data.login.token) {
      localStorage.token = data.login.token;
      localStorage.email = data.login.email;
      
      history.push('/');
    };
  }, [data])

  return(
    <>
      <form 
        onSubmit={e => {
          e.preventDefault()
          onSubmit();
        }}
      >
        <FormControl label='Email'>
          <Input 
            value={value.email}
            onChange={e => setValue({...value, email: e.target.value})}
            error={!isValid.email}
          />
        </FormControl>
        <FormControl label='Password'>
          <Input 
            value={value.password}
            onChange={e => setValue({...value, password: e.target.value})}
            error={!isValid.password}
            type='password' 
          />
        </FormControl>
        <Button type='submit' isLoading={loading}>Login</Button>
      </form>
      <ErrorMessage error={error} />
    </>
  )
}

export default LoginForm;
