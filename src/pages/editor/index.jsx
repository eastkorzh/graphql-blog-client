import React, { useState, useEffect, createRef } from 'react';

import { br } from './constants';
import shiftEnter from './shiftEnter';
import enter from './enter';
import backspace from './backspace';
import initialState from './initialState';
import throttle from 'utils/throttle';
import s from './styles.module.scss';

const Editor = () => {
  const [articleState, setArticleState] = useState(initialState);
  const [caretPosition, setCaretPosition] = useState(null)
  const articleRef = createRef();

  useEffect(() => {
    if (caretPosition) {
      const { nodeAddress, offset } = caretPosition;
      console.log(nodeAddress, offset)
      //document.getSelection().collapse(null)
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
    if (anchorNode === null || !anchorNode.data || focusNode === null || !focusNode.data) return;
    const { nodeWithDataset: anchorWithRootDataset} = getNodeWithDataset(anchorNode);
    const { nodeWithDataset: focusWithRootDataset} = getNodeWithDataset(focusNode);
    const { nodeWithDataset: anchorWithDataset } = getNodeWithDataset(anchorNode, 'spanindex');
    const { nodeWithDataset: focusWithDataset } = getNodeWithDataset(focusNode, 'spanindex');

    const anchorText = anchorNode.data;
    const focusText = focusNode.data;

    const anchorDataset = anchorWithDataset.dataset.spanindex.split(',').map(a => parseInt(a));
    const focusDataset = focusWithDataset.dataset.spanindex.split(',').map(a => parseInt(a));

    const selectedRange = [
      anchorDataset,
      focusDataset,
    ];

    let selection = null;

    const getFullOffset = (rootNode, text, offset) => {
      let result = 0;

      for (let node of rootNode.childNodes) {
        if (node.textContent !== text) {
          result += node.textContent.length;
        } else {
          result += offset;
          break;
        }
      }

      return result;
    }

    if (isCollapsed) {
      selection = getFullOffset(anchorWithRootDataset, anchorText, anchorOffset);
    } else {
      if (selectedRange[0][0] === selectedRange[1][0] && selectedRange[0][1] === selectedRange[1][1]) {
        selectedRange[0].push(getFullOffset(anchorWithRootDataset, anchorText, anchorOffset));
        selectedRange[1].push(getFullOffset(anchorWithRootDataset, focusText, focusOffset));
      } else {
        selectedRange[0].push(getFullOffset(anchorWithRootDataset, anchorText, anchorOffset));
        selectedRange[1].push(getFullOffset(focusWithRootDataset, focusText, focusOffset));
      }
    }

    return {
      offset: anchorOffset < focusOffset ? anchorOffset : focusOffset,
      selection,
      nodeAddress: selectedRange[0].slice(0, 3),
      selectedRange: selectedRange.sort((a, b) => a - b),
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
    const { offset, selection, nodeAddress, selectedRange } = selectChange();

    const kyeDownReducer = (articleState, e) => {
      switch (e.keyCode) {
        case 13:
          if (e.shiftKey) {
            e.preventDefault();
            return shiftEnter(articleState, selection, nodeAddress, selectedRange);
          }
        case 13:
          e.preventDefault();
          return enter(articleState, selection, nodeAddress, selectedRange);
        case 8:
          return backspace(articleState, offset, selection, nodeAddress, articleRef, e, selectedRange);
      }
    }

    const result = kyeDownReducer(articleState, e);

    if (result) {
      const { newState, newCaretPosition } = result;

      setArticleState(newState);
      setCaretPosition(newCaretPosition);
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
