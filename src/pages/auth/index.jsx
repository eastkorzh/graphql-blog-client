import React, { useState } from 'react';
import Close from 'baseui/icon/delete';

import RegisterFrom from './registerForm';
import LoginFrom from './loginForm';

import s from './styles.module.scss';

const Auth = ({ history }) => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className={s.container}>
      <div className={s.close} onClick={() => history.push('/')}>
        <Close size={60} />
      </div>
      <div className={s.authToggle}>
        <div 
          onClick={() => setShowLogin(true)}
          style={showLogin ? {borderBottom: '2px solid #e2e2e2'} : {}}
        >
          Login
        </div>
        <div 
          onClick={() => setShowLogin(false)}
          style={!showLogin ? {borderBottom: '2px solid #e2e2e2'} : {}}
        >
          Register
        </div>
      </div>
      {showLogin ? 
        <LoginFrom history={history}/> :
        <RegisterFrom history={history}/>
      }
    </div>
  )
}

export default Auth;
