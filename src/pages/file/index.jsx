import React, { useState } from 'react';
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'

export const UPLOAD_FILE = gql`
  mutation uploadFile($file: Upload!) {
    singleUpload(file: $file) {
      filename
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
      console.log(f)
      uploadFile({ variables: { file: f } })
    };
  }  

  console.log('file', data);

  return (
    <div>
      <input type="file" accept='image/*' onChange={onChange}/>
      {file &&
      <div style={{maxWidth: '600px'}}>
        <img style={{width: '100%'}} src={window.URL.createObjectURL(file)} alt=""/>
      </div>
      }
    </div>
  )
}

export default File;
