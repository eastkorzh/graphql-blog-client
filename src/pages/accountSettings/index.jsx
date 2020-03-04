import React, { useState, useEffect, useDebugValue } from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { validate as validateEmail } from 'email-validator';

import Input from 'components/input';
import {Button} from 'baseui/button';
import ErrorMessage from 'components/errorMessage';
import { FormControl } from 'baseui/form-control';
import EditableAvatar from 'components/editableAvatar';
import s from './styles.module.scss';

const LOGGED_USER = gql`
  query getLoggedUser {
    me {
      name
      email
    }
  }
`

const UPDATE_USER_NAME = gql`
  mutation updateUserName(
    $newName: String!
  ) {
    updateUserName(
      newName: $newName
    ) {
      name
    }
  }
`

const UPDATE_USER_EMAIL = gql`
  mutation updateUserEmail(
    $newEmail: String!
  ) {
    updateUserEmail(
      newEmail: $newEmail
    ) {
      email
    }
  }
`

const AccountSettings = () => {
  const { data: userData, loading: userDataLoading, client } = useQuery(LOGGED_USER);
  const [ updateUserName, { data: newUserName, error: updateNameError, loading: userNameUpdating }] = useMutation(UPDATE_USER_NAME);
  const [ updateUserEmail, { data: newUserEmail, error: updateEmailError, loading: userEmailUpdating }] = useMutation(UPDATE_USER_EMAIL);

  const [value, setValue] = useState({
    name: '',
    email: '',
    currPassvord: '',
    newPassword: '',
    newPasswordAgain: '',
  })

  const [isValid, setValid] = useState({
    email: true,
    name: true,
    currPassvord: true,
    newPassword: true,
    newPasswordAgain: true,
  });

  useEffect(() => {
    if (userData) {
      setValue({
        ...value,
        name: userData.me.name,
        email: userData.me.email,
      })
    }
  }, [userData])

  useEffect(() => {
    if (newUserName) {
      client.writeData({ data: {
        me: {
          ...userData.me,
          name: newUserName.updateUserName.name,
        }
      }})
    }
  }, [newUserName])

  useEffect(() => {
    if (newUserEmail) {
      client.writeData({ data: {
        me: {
          ...userData.me,
          email: newUserEmail.updateUserEmail.email,
        }
      }})
    }
  }, [newUserEmail])

  const updateUser = (prop) => {
    if (prop === 'name') {
      const isValidName = value.name.length >= 2;

      if (isValid.name !== isValidName) {
        setValid({
          ...isValid,
          name: isValidName,
        })
      }

      if (isValidName) {
        updateUserName({ variables: {
          newName: value.name,
        }}).catch(() => null)
      }
    }

    if (prop === 'email') {
      const isValidEmail = validateEmail(value.email);

      if (isValid.email !== isValidEmail) {
        setValid({
          ...isValid,
          email: isValidEmail,
        })
      }

      if (isValidEmail) {
        updateUserEmail({ variables: {
          newEmail: value.email,
        }}).catch(() => null)
      }
    }
  }

  return (
    <div className={s.container}>
      <div className={s.content}>
        <EditableAvatar size='170px' />
        <div className={s.forms}>
          <div className={s.inputBlock}>
            <div>
              <FormControl
                label='Name'
              >
                <Input 
                  value={value.name}
                  onChange={e => setValue({...value, name: e.target.value})}
                  error={!isValid.name || updateNameError}
                />
              </FormControl>
            </div>
            <Button
              onClick={() => updateUser('name')}
              disabled={!userData || (userDataLoading || value.name === userData.me.name)}
              overrides={{
                BaseButton: {
                  style: ButtonStyle
                }
              }}
              isLoading={userNameUpdating}
            >
              Ok
            </Button>
          </div>
          <div className={s.inputBlock}>
            <div>
              <FormControl
                label='Email'
              >
                <Input 
                  value={value.email}
                  onChange={e => setValue({...value, email: e.target.value})}
                  error={!isValid.email || updateEmailError}
                />
              </FormControl>
            </div>
            <Button
              onClick={() => updateUser('email')}
              disabled={!userData || (userDataLoading || value.email === userData.me.email)}
              overrides={{
                BaseButton: {
                  style: ButtonStyle
                }
              }}
              isLoading={userEmailUpdating}
            >
              Ok
            </Button>
          </div>
        </div>
      </div>
      <ErrorMessage error={updateNameError || updateEmailError} />
    </div>
  )
}

const ButtonStyle = {
  height: '48px',
  marginTop: '32px',
  marginLeft: '10px',
}

export default AccountSettings;
