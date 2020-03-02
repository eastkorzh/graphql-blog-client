import React, { useState } from 'react';
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'
import { useEffect } from 'react';

export const UPLOAD_FILE = gql`
  mutation updateUserAvatar($file: Upload!) {
    updateUserAvatar(file: $file) {
      name
      email
      avatar
    }
  }
`;

const File = () => {
  const [file, setFile] = useState(null);

  const [uploadFile, { data, error, loading }] = useMutation(UPLOAD_FILE);

  const onChange = ({ 
    target: {
      validity,
      files: [f]
    }
  }) => {
    if (validity.valid) {
      setFile(f);
      uploadFile({ variables: { file: f } })
    };
  }

  useEffect(() => {
    if (data) console.log(data)
  }, [data])

  return (
    <div>
      <input type="file" accept='image/*' onChange={onChange}/>
      {file &&
      <div style={{maxWidth: '600px', maxHeight: '400px'}}>
        {(loading && !data) ? 
          <img style={{maxWidth: '100%'}} src={window.URL.createObjectURL(file)} alt=""/> :
          <img style={{maxWidth: '100%'}} src={data.updateUserAvatar.avatar} alt=""/> 
        }
      </div>
      }
    </div>
  )
}

export default File;
