import React, { useState, useEffect } from 'react';
import shortid from 'shortid';

import { zws } from '../constants';
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

const AddPhoto = ({ articleState, setArticleState, articleRef }) => {
  const [ isOpen, setIsOpen ] = useState(false);
  const [ emptyNodeTop, setEmptyNodeTop ] = useState(null)
  const [ nodeAddress, setNodeAddress ] = useState(null);

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

  const uploadPhoto = (photo) => {
    const src = window.URL.createObjectURL(photo);
    
    if (nodeAddress && articleState) {
      const stateCopy = {...articleState};
      const nweState = {
        ...stateCopy,
        article: [],
      }

      for (let i=0; i<=stateCopy.article.length; i++) {
        const node = stateCopy.article[i];
        if (!node) break;

        if (i === nodeAddress[0]+1) {
          nweState.article.push({
            id: shortid.generate(),
            type: 'text',
            content: [{
              text: zws,
              styles: null,
            }],
          });
          nweState.caretPosition = {
            nodeAddress: [i, 0, 0],
            offset: 1,
          }
          continue;
        }

        if (i !== nodeAddress[0]) {
          nweState.article.push(node)
        } else {
          nweState.article.push({
            id: shortid.generate(),
            type: 'img',
            src,
          })
        }
      }

      setIsOpen(false)

      setArticleState(nweState);
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
              //uploadFile({ variables: { file } }).catch(() => null)
            }}
            // progressMessage={
            //   avatarLoading ? `Uploading...` : ''
            // }
            // errorMessage={avatarError && avatarError.message}
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
