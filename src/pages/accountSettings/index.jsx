import React, { useState, useEffect, useDebugValue } from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { validate as validateEmail } from 'email-validator';

import Close from 'baseui/icon/delete';
import Input from 'components/input';
import { Button } from 'baseui/button';
import { Notification, KIND } from 'baseui/notification';
import ErrorMessage from 'components/errorMessage';
import { FormControl } from 'baseui/form-control';
import EditableAvatar from 'components/editableAvatar';
import s from './styles.module.scss';

const LOGGED_USER = gql`
  query getLoggedUser {
    me {
      _id
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

const UPDATE_USER_PASSWORD = gql`
  mutation updateUserPassword(
    $oldPassword: String!
    $newPassword: String!
  ) {
    updateUserPassword(
      oldPassword: $oldPassword
      newPassword:$newPassword
    ) {
      _id
      name
      email
    }
  }
`

const AccountSettings = ({ history }) => {
  const { data: userData, loading: userDataLoading, client } = useQuery(LOGGED_USER);
  const [ updateUserName, { data: newUserName, error: updateNameError, loading: userNameUpdating }] = useMutation(UPDATE_USER_NAME);
  const [ updateUserEmail, { data: newUserEmail, error: updateEmailError, loading: userEmailUpdating }] = useMutation(UPDATE_USER_EMAIL);
  const [ updateUserPassword, { data: newUserPassword, error: updatePasswordError, loading: userPasswordUpdating }] = useMutation(UPDATE_USER_PASSWORD);

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

  useEffect(() => {
    if (newUserPassword) {
      setValue({
        ...value,
        currPassvord: '',
        newPassword: '',
        newPasswordAgain: '',
      })
    }
  }, [newUserPassword])

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

  const changePassword = () => {
    const isValidCurrentPassword = value.currPassvord.length >= 6;
    const isValidNewPasssword = value.newPassword.length >= 6;
    const isValidNewPasswordAgain = value.newPassword === value.newPasswordAgain;

    setValid({
      ...isValid,
      currPassvord: isValidCurrentPassword,
      newPassword: isValidNewPasssword && isValidNewPasswordAgain,
      newPasswordAgain: isValidNewPasswordAgain,
    })

    if (isValidCurrentPassword && isValidNewPasssword && isValidNewPasswordAgain) {
      updateUserPassword({ variables: {
        oldPassword: value.currPassvord,
        newPassword: value.newPassword,
      }}).catch(() => null)
    }
  }

  return (
    <div className={s.container}>
      <div className={s.close} onClick={() => history.goBack()}>
        <Close size={60} />
      </div>
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
        <form 
          className={s.passwordForm}
          onSubmit={e => {
            e.preventDefault()
            changePassword()
          }}
        >
          <FormControl
            label='Current Password'
          >
            <Input 
              value={value.currPassvord}
              onChange={e => setValue({...value, currPassvord: e.target.value})}
              error={!isValid.currPassvord}
              type='password' 
            />
          </FormControl>
          <FormControl
            label='New Password'
          >
            <Input 
              value={value.newPassword}
              onChange={e => setValue({...value, newPassword: e.target.value})}
              error={!isValid.newPassword}
              type='password' 
            />
          </FormControl>
          <FormControl
            label='New Password again'
          >
            <Input 
              value={value.newPasswordAgain}
              onChange={e => setValue({...value, newPasswordAgain: e.target.value})}
              error={!isValid.newPasswordAgain}
              type='password' 
            />
          </FormControl>
          <Button type='submit' isLoading={userPasswordUpdating}>Change Password</Button>
        </form>
      </div>
      {newUserPassword &&
        <Notification kind={KIND.positive} closeable>
          Password changed
        </Notification>
      }
      <ErrorMessage error={updateNameError || updateEmailError || updatePasswordError} />
    </div>
  )
}

const ButtonStyle = {
  height: '48px',
  marginTop: '32px',
  marginLeft: '10px',
}

export default AccountSettings;
