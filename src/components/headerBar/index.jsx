import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import s from './styles.module.scss';

const LOGGED_USER = gql`
  query getLoggedUser {
    me {
      _id
      name
      email
      posts {
        _id
        title
        description
        content
      }
    }
  }
`

const HeaderBar = () => {
  const { data, loading, error } = useQuery(LOGGED_USER);

  const Navs = () => (
    <nav className={s.navs}>
      <Link to='/'>Feed</Link>
      <Link to='/'>My posts</Link>
    </nav>
  )

  return(
    <div className={s.container}>
      <div className={s.content}>
        <div className={s.logo}><span>console</span>.blog<span>(<Navs />)</span></div>
        
        <div>{(data && data.me.name )|| 'Anonimous'}</div>
      </div>
    </div>
  )
}

export default HeaderBar;
