import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useApolloClient } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { Button } from 'baseui/button';
import { Avatar } from 'baseui/avatar';
import { Spinner } from "baseui/spinner";

import s from './styles.module.scss';

const LOGGED_USER = gql`
  query getLoggedUser {
    me {
      _id
      name
      email
      avatar
    }
  }
`

const AboutUser = () => {
  const [isExpended, setExpended] = useState(false);
  const client = useApolloClient();

  const { data, loading } = useQuery(LOGGED_USER);

  const logout = () => {
    localStorage.token = '';
    client.writeData({ data: { me: null } })
  }

  return (
    <>
      {loading ? <Spinner /> :
        ((data && data.me) ?
          <div 
            className={s.aboutUser}
            onMouseEnter={() => setExpended(true)}
            onMouseLeave={() => setExpended(false)}
          >
            <div className={s.collapsed}>
              <div className={s.name}>{data.me.name}</div>
              <Avatar 
                name={data.me.name}
                size='scale1000'
                src={data.me.avatar}
              />
            </div>
            {isExpended &&
              <div className={s.expendedInfo}>
                <div className={s.collapsed}>
                  <div className={s.name}>{data.me.name}</div>
                  <Avatar 
                    name={data.me.name}
                    size='scale1000'
                    src={data.me.avatar}
                  />
                </div>
                <div className={s.buttons}>
                  <Link to='/account'>
                    <div className={s.item}>Account</div>
                  </Link>
                  <Link to='/auth' onClick={logout}>
                    <div className={s.item}>Log Out</div>
                  </Link>
                </div>
              </div>
            }
          </div> :
          <div>
            <Link to='/auth'>
              <Button
                overrides={{
                  BaseButton: {
                    style: {
                      ...ButtonStyle,
                      marginRight: '10px',
                    }
                  }
                }}
              >
                Login
              </Button>
            </Link>
            <Link to='/auth'>
              <Button
                overrides={{
                  BaseButton: {
                    style: ButtonStyle
                  }
                }}
              >
                Register
              </Button>
            </Link>
          </div>
        ) 
      }
    </>
  )
}

const ButtonStyle = {
  paddingTop: '10px',
  paddingBottom: '10px',
  fontWeight: '700',
}

export default AboutUser;
