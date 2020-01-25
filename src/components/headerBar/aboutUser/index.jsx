import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
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
    }
  }
`

const AboutUser = () => {
  const [isExpended, setExpended] = useState(false);

  const { data, loading } = useQuery(LOGGED_USER);

  return (
    <>
      {loading ? <Spinner /> :
        (data ?
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
              />
            </div>
            {isExpended &&
              <div className={s.expendedInfo}>
                <div className={s.collapsed}>
                  <div className={s.name}>{data.me.name}</div>
                  <Avatar 
                    name={data.me.name}
                    size='scale1000'
                  />
                </div>
                <div className={s.item}>Settings</div>
                <div className={s.item}>Log Out</div>
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
