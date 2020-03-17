import React from 'react';

import s from './styles.module.scss';

const Footer = () => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <div>Created by <a href="https://github.com/eastkorzh">Mikhail Korzhev</a></div>
        <div className={s.item}>
          <img src={require('img/github.png')} alt=""/>
          <div className={s.text}>
            <a href="https://github.com/eastkorzh/graphql-blog-client" target="_blank">Frontend</a>
            <span>{', '}</span>
            <a href="https://github.com/eastkorzh/graphql-blog-server" target="_blank">Backend</a>
            <span>{' source code'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer;
