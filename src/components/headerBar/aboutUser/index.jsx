import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLazyQuery } from '@apollo/react-hooks';
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
  const [ getLoggedUser, { data, loading, client, refetch }] = useLazyQuery(LOGGED_USER, {
    onError({ message }) {
      console.log(message);
    }
  });

  const logout = () => {
    localStorage.token = '';
    client.writeData({ data: { me: null } });
  }

  useEffect(() => {
    if (localStorage.token) getLoggedUser();
  }, [])

  useEffect(() => {
    if (data && !data.me) refetch();
  }, [refetch])

  return (
    <>
      {loading ? <Spinner color="#e2e2e2" size={40}/> :
        ((data && data.me) ?
          <div className={s.aboutUser}>
            <div className={s.collapsed}>
              <div className={s.name}>{data.me.name}</div>
              <Avatar 
                name={data.me.name}
                size={'40px'}
                overrides={{
                  Avatar: {
                    style: {
                      '@media (max-width: 435px': {
                        width: '30px',
                        height: '30px'
                      }
                    }
                  }
                }}
                src={data.me.avatar}
              />
            </div>
              <div className={s.expendedInfo}>
                <div className={s.expended}>
                  <div className={s.expendedName}>{data.me.name}</div>
                  <Avatar 
                    name={data.me.name}
                    size={'40px'}
                    overrides={{
                      Avatar: {
                        style: {
                          '@media (max-width: 435px': {
                            width: '30px',
                            height: '30px'
                          }
                        }
                      }
                    }}
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
          </div> :
          <div>
            <Link to='/auth'>
              <Button
                overrides={{
                  BaseButton: {
                    style: {
                      ...ButtonStyle,
                      marginRight: '25px',
                    }
                  }
                }}
              >
                Auth
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
