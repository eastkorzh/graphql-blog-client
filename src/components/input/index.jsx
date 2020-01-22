import React from 'react';
import { Input as BaseuiInput } from 'baseui/input';

const Input = (props) => {
  return (
    <BaseuiInput 
      {...props}
      overrides={{
        InputContainer: {
          style: {
            // borderTopLeftRadius: '5px',
            // borderTopRightRadius: '5px',
            // borderBottomLeftRadius: '5px',
            // borderBottomRightRadius: '5px',
          }
        }
      }}
    />
  )
}

export default Input;
