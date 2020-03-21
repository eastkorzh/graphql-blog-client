import React from 'react';
import { Link } from 'react-router-dom';
import AboutUser from './aboutUser';
import cx from 'classnames';

import s from './styles.module.scss';

const HeaderBar = ({ match }) => {
  const matchPath = (path) => (
    match.path === path ? {backgroundColor: 'rgba(202, 142, 118, .2)'} : {}
  )

  const Navs = () => (
    <nav className={s.navs}>
      <Link to='/'>
        <span 
          style={matchPath('/')}
        >
          '<span className={cx({[s.hover]: match.path !== '/' })}>
            Feed
          </span>'
        </span>
      </Link>
      <Link to='/editor'>
        <span 
          style={matchPath('/editor')}
        >
          '<span className={cx({[s.hover]: match.path !== '/editor' })}>
            Editor
          </span>'
        </span>
      </Link>
    </nav>
  )

  return(
    <div className={s.container}>
      <div className={s.content}>
        <div className={s.logo}><span>console</span>.blog<span>(<Navs />)</span></div>
        <AboutUser />
      </div>
    </div>
  )
}

export default HeaderBar;
