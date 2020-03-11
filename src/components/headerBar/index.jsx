import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AboutUser from './aboutUser';

import s from './styles.module.scss';

const HeaderBar = () => {
  const Navs = () => (
    <nav className={s.navs}>
      <Link to='/'>Feed</Link>
      <Link to='/editor'>Editor</Link>
      {/* <Link to='/editor'>Make Post</Link> */}
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
