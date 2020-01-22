import React from 'react';
import { Button as BaseuiButton } from 'baseui/button';

const Button = (props) => {
  return (
    <BaseuiButton
      {...props}
      overrides={{
        BaseButton: {
          style: ({ $theme }) => {
            return { 
              // borderTopLeftRadius: '5px',
              // borderTopRightRadius: '5px',
              // borderBottomLeftRadius: '5px',
              // borderBottomRightRadius: '5px',
            };
          }
        }
      }}
    >
      {props.children}
    </BaseuiButton>
  )
}

export default Button;
