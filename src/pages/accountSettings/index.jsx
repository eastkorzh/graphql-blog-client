import React, { useState, useEffect, useDebugValue } from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

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

const AccountSettings = () => {
  const { data: userData } = useQuery(LOGGED_USER);

  return (
    <div>
      <EditableAvatar size='200px' />
    </div>
  )
}

export default AccountSettings;
