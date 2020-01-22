import React from 'react';

import s from './styles.module.scss';

const ErrorMessage = ({ error }) => {
  return (
    <>
      {error &&
        <div className={s.error}>{error.message}</div>
      }
    </>
  )
}

export default ErrorMessage;
