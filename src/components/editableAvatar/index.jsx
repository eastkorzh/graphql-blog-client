import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import { FileUploader } from 'baseui/file-uploader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
} from 'baseui/modal';
import s from './styles.module.scss';

const LOGGED_USER = gql`
  query getLoggedUser {
    me {
      name
      avatar
    }
  }
`

export const UPLOAD_FILE = gql`
  mutation updateUserAvatar($file: Upload!) {
    updateUserAvatar(file: $file) {
      avatar
    }
  }
`;

const EditableAvatar = ({ size = '100px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data, client } = useQuery(LOGGED_USER);
  const [uploadFile, { data: updatedAvatar, error: avatarError, loading: avatarLoading }] = useMutation(UPLOAD_FILE);

  useEffect(() => {
    if (updatedAvatar) {
      setIsOpen(false);
      client.writeData({ data: {
        me: {
          ...data.me,
          avatar: updatedAvatar.updateUserAvatar.avatar,
        }
      }})
    }
  }, [updatedAvatar])

  return (
    <>
      <div className={s.container} onClick={() => setIsOpen(true)} style={{ width: size, height: size}}>
        <div className={s.edit} style={{ width: size, height: size}}>
          <img 
            style={{ 
              width: parseInt(size.split('px')[0])/5 + 'px'
            }}
            src={require('img/edit.svg')} 
            alt="edit"
          />
        </div>
        <div className={s.avatar}>
          {data &&
            (data.me.avatar ? 
              <img src={data.me.avatar} alt={data.me.name} /> :
              <div 
                style={{ 
                  fontSize: parseInt(size.split('px')[0])/3 + 'px'
                }}
              >
                {data.me.name.slice(0, 1).toUpperCase()}
              </div>
            )
          }
        </div>
      </div>
      <Modal onClose={() => setIsOpen(false)} isOpen={isOpen} autofocus={false}>
        <ModalHeader>Update avatar</ModalHeader>
        <ModalBody>
          <FileUploader 
            accept='image/*'
            onDrop={(acceptedFiles) => {
              uploadFile({ variables: { file: acceptedFiles[0] } }).catch(() => null)
            }}
            progressMessage={
              avatarLoading ? `Uploading...` : ''
            }
            errorMessage={avatarError && avatarError.message}
          />
        </ModalBody>
        <ModalFooter>
          <ModalButton onClick={() => setIsOpen(false)}>Close</ModalButton>
        </ModalFooter>
      </Modal>
    </>
  )
};

export default EditableAvatar;
