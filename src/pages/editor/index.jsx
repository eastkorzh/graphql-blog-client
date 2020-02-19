import React, { useState, useEffect, createRef } from 'react';

import { br } from './constants';
import shiftEnter from './shiftEnter';
import enter from './enter';
import backspace from './backspace';
import initialState from './initialState';
import throttle from 'utils/throttle';
import s from './styles.module.scss';

let keys = [];

const Editor = () => {
  const [articleState, setArticleState] = useState(initialState);
  const [caretPosition, setCaretPosition] = useState(null)
  const articleRef = createRef();

  useEffect(() => {
    if (caretPosition) {
      const { nodeAddress, offset } = caretPosition;

      const caretNode = articleRef.current
        .childNodes[nodeAddress[0]]
        .childNodes[nodeAddress[1]]
        .childNodes[nodeAddress[2]]

      caretNode && document.getSelection().collapse(caretNode.lastChild, offset);
    }
  }, [articleState, caretPosition, articleRef])

  const getNodeWithDataset = (anchorNode, dataset = 'index') => {
    if (anchorNode === null) return null;
    let index = null;
    let nodeWithDataset = anchorNode;
    
    while (true) {
      let i = 0;
      if (nodeWithDataset.dataset && nodeWithDataset.dataset[dataset]) {
        index = parseInt(nodeWithDataset.dataset[dataset]);
        break;
      } else {
        if (i < 20) i++ 
        else break;
        nodeWithDataset = nodeWithDataset.parentNode;
      }
    }

    return { index, nodeWithDataset }
  }

  const selectChange = () => {
    const { anchorNode, anchorOffset, focusNode, focusOffset, isCollapsed } = document.getSelection();
    if (anchorNode === null || !anchorNode.data) return;
    const anchorText = anchorNode.data;
    const focusText = focusNode.data;
    const result = [0, 0];
  
    const { nodeWithDataset } = getNodeWithDataset(anchorNode);

    let anchorOffsetFounded = false;
    let focusOffsetFounded = false;

    for (let node of nodeWithDataset.childNodes) {
      if (!anchorOffsetFounded) {
        if (node.textContent !== anchorText) {
          result[0] += node.textContent.length;
        } else {
          result[0] += anchorOffset;
          anchorOffsetFounded = true;
        }
      }
      
      if (!focusOffsetFounded) {
        if (node.textContent !== focusText) {
          result[1] += node.textContent.length;
        } else {
          result[1] += focusOffset;
          focusOffsetFounded = true;
        }
      }

      if (anchorOffsetFounded && focusOffsetFounded) break;
    }

    const nodeAddress = getNodeWithDataset(anchorNode, 'spanindex')
      .nodeWithDataset
      .dataset
      .spanindex.split(',')
      .map(a => parseInt(a))

    return {
      offset: anchorOffset,
      selection: isCollapsed ? result[0] : result.sort((a, b) => a - b),
      nodeAddress,
    }
  }

  const onArticleChange = () => {
    const result = [];

    // iterate paragraphs
    for (let node of articleRef.current.childNodes) {
      const paragraph = {
        type: 'text',
        content: []
      }

      // itarate paragraphs text blocks
      for (let childNode of node.childNodes) {
        if (childNode.localName === 'span') {
          if (childNode.childNodes.length > 1) {
            const styles = [];
            let offset = 0;

            // iterate text blocks spans
            for (let styledNode of childNode.childNodes) {
              const { fontWeight, fontStyle } = styledNode.style;
              
              styles.push({
                style: {
                  fontWeight,
                  fontStyle,
                },
                range: [offset, offset+styledNode.textContent.length]
              })
              offset += styledNode.textContent.length;
            }

            paragraph.content.push({
              text: childNode.textContent,
              styles,
            })
          } else {
            paragraph.content.push({
              text: childNode.textContent,
              styles: null
            })
          }
        } else {
          paragraph.content.push(br)
        }
      }

      result.push(paragraph)
    }
    
    setArticleState(result)
    setCaretPosition(selectChange())
    
    // prevent caret blinking at offset 0 after rerender
    document.getSelection().collapse(null)
  }

  const onKeyDown = (e) => {
    const { offset, selection, nodeAddress } = selectChange()

    // Shift + Enter logger
    if ((e.keyCode === 16 && keys.indexOf(16) === -1) ||
    (e.keyCode === 13 && keys.indexOf(13) === -1)) {
      keys.push(e.keyCode);
    }

    const kyeDownReducer = (articleState, e) => {
      switch (e.keyCode) {
        case (13 || 16):
          if (keys.length >= 2) {
            let isRightCombination = true;
            const sorted = keys.sort((a, b) => a - b);
            const shiftPlusEnter = [13, 16];
          
            for (let i = 0; i < shiftPlusEnter.length; i++) {
              if (sorted[i] !== shiftPlusEnter[i]) {
                isRightCombination = false;
                break;
              }
            }
          
            if (isRightCombination) {
              e.preventDefault();
              return shiftEnter(articleState, selection, nodeAddress);
            }
          }
        case 13:
          e.preventDefault();
          return enter(articleState, selection, nodeAddress);
        case 8:
          return backspace(articleState, offset, selection, nodeAddress, articleRef, e);
      }
    }

    const result = kyeDownReducer(articleState, e);

    if (result) {
      const { newState, newCaretPosition } = result;

      setArticleState(newState);
      setCaretPosition(newCaretPosition);
    }
  }

  const keyUp = (e) => {
    if (e.keyCode === 16 || e.keyCode === 13) {
      keys = keys.filter(item => item !== e.keyCode)
    }
  }
  
  document.onselectionchange = throttle(selectChange, 300);

  return (
    <div className={s.container}>
      <article
        contentEditable={true} 
        suppressContentEditableWarning={true}
        onInput={onArticleChange}
        onKeyDown={onKeyDown}
        onKeyUp={keyUp}
        ref={articleRef}
      >
        {articleState && articleState.map((item, index) => {
          if (item.type === 'text') {
            return (
              <p data-index={index} key={index}>
                {item.content.map((contentItem, contentIndex) => {
                  if (contentItem === br) {
                    return <br key={contentIndex}/>
                  } else {
                    const { text, styles } = contentItem;
                    let result = [];
                    if (styles) {
                      for (let i=0; i<styles.length; i++) {
                        result.push(
                          <span key={i} data-spanindex={[index, contentIndex, i]} style={styles[i].style}>{text.slice(...styles[i].range)}</span>);
                      }
                    } else {
                      result = <span data-spanindex={[index, contentIndex, 0]}>{text}</span>;
                    }
                    return (
                      <span 
                        data-index={index} 
                        data-contentindex={contentIndex}
                        key={contentIndex}
                      >
                        {result}
                      </span>
                    )
                  }
                })}
              </p>
            )
          } else return null;
        })}
      </article>
    </div>
  )
}

export default Editor;
