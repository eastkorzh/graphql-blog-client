import React, { useState, useEffect } from 'react';
import shortid from 'shortid';
import { useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import { zws, br } from '../constants';
import selectionChange from '../utils/selectionChange';
import throttle from 'utils/throttle';
import { FileUploader } from 'baseui/file-uploader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
} from 'baseui/modal';
import s from './styles.module.scss';

const ADD_PHOTO = gql`
  mutation addPhoto(
    $file: Upload!
    $id: ID!
  ) {
    addPhoto(
      file: $file
      id: $id
    ) {
      url
      id
    }
  }
`;

const AddPhoto = ({ articleState, setArticleState, articleRef }) => {
  const [ isOpen, setIsOpen ] = useState(false);
  const [ emptyNodeTop, setEmptyNodeTop ] = useState(null)
  const [ nodeAddress, setNodeAddress ] = useState(null);
  const [ uploadPhotoMutation ] = useMutation(ADD_PHOTO, {
    onCompleted({ addPhoto }) {
      const stateCopy = {...articleState};
      const { id, url } = addPhoto;
      
      stateCopy.article = stateCopy.article.map((item) => {
        if (item === br || item.id !== id) return item;

        return {
          ...item,
          src: url,
        }
      })

      setArticleState(stateCopy)
    }
  });

  const onSelectionChange = () => {
    const anchorNode = document.getSelection().anchorNode;

    if (!anchorNode || !anchorNode.parentNode.dataset.spanindex) {
      if (emptyNodeTop) setEmptyNodeTop(null);
      return;
    }

    if (!anchorNode || anchorNode.parentNode.parentNode.parentNode.childNodes.length !== 1) {
      if (emptyNodeTop) {
        setEmptyNodeTop(null);
        setNodeAddress(null)
      }
      return;
    }
    
    if (anchorNode.parentNode.parentNode.parentNode.childNodes[0].textContent.length > 1) {
      if (emptyNodeTop) {
        setEmptyNodeTop(null);
        setNodeAddress(null)
      }
      return;
    };

    const selection = selectionChange();
    if (selection && selection.nodeAddress) {
      const { nodeAddress: nA } = selection;
      
      if (articleState && articleState.article && articleRef.current) {
        const node = articleState.article[nA[0]];
  
        if (node.type === 'text' && node.content.length === 1 && node.content[0].text === zws) {
          const caretNode = articleRef.current
            .childNodes[nA[0]]
            .childNodes[nA[1]]

          setEmptyNodeTop(caretNode.getBoundingClientRect().top - articleRef.current.parentNode.getBoundingClientRect().top - 2);
          setNodeAddress(nA)
        } else {
          setEmptyNodeTop(null);
          setNodeAddress(null)
        }
      }
    }
  }

  const uploadPhoto = async (photo) => {
    if (!nodeAddress) return;

    const src = window.URL.createObjectURL(photo);
    const imageId = shortid.generate();

    if (nodeAddress && articleState) {
      const stateCopy = {...articleState};
      const newState = {
        ...stateCopy,
        article: [],
      }

      for (let i=0; i<=stateCopy.article.length; i++) {
        const node = stateCopy.article[i];
        
        if (!node && i !== stateCopy.article.length) break;

        if (i === nodeAddress[0]+1) {
          newState.article.push({
            id: shortid.generate(),
            type: 'text',
            content: [{
              text: zws,
              styles: null,
            }],
          });
          newState.caretPosition = {
            nodeAddress: [i, 0, 0],
            offset: 1,
          }
          continue;
        }

        if (i !== nodeAddress[0]) {
          if (node) newState.article.push(node)
        } else {
          newState.article.push({
            id: imageId,
            type: 'img',
            src,
          })
        }
      }

      setIsOpen(false)

      setArticleState(newState);

      uploadPhotoMutation({ 
        variables: { 
          file: photo, 
          id: imageId 
        }
      })
    }
  }

  useEffect(() => {
    onSelectionChange()
  }, [articleState])

  document.onselectionchange = throttle(onSelectionChange, 300);

  return (
    <>
      {emptyNodeTop &&
        <div className={s.container} style={{ top: emptyNodeTop }} onClick={() => setIsOpen(true)}>
          <img src={require('img/camera.svg')} alt="addPhoto"/>
        </div> 
      }
      <Modal onClose={() => setIsOpen(false)} isOpen={isOpen} autofocus={false}>
        <ModalHeader>Add Photo</ModalHeader>
        <ModalBody>
          <FileUploader 
            accept='image/*'
            onDrop={(acceptedFiles) => {
              const photo = acceptedFiles[0];
              
              uploadPhoto(photo);
            }}
          />
        </ModalBody>
        <ModalFooter>
          <ModalButton onClick={() => setIsOpen(false)}>Close</ModalButton>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddPhoto;
