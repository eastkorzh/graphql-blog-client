import React, { useState, useEffect, createRef } from 'react';
import cx from 'classnames';

import { br, zws } from './constants';
import insertText from './insertText';
import deleteSelected from './deleteSelected';
import shiftEnter from './shiftEnter';
import enter from './enter';
import backspace from './backspace';
import initialState from './initialState';
import throttle from 'utils/throttle';
import s from './styles.module.scss';

const Editor = () => {
  const [articleState, setArticleState] = useState({
    h1: zws,
    article: [{
      type: 'text',
      content: [{
        text: zws,
        styles: null
      }]
    }]
  });
  const articleRef = createRef();
  const headerRef = createRef();

  useEffect(() => {
    if (articleState && articleState.caretPosition) {
      const { nodeAddress, offset } = articleState.caretPosition;

      let caretNode = null;
      
      if (nodeAddress === null) {
        caretNode = headerRef.current;
      } else {
        caretNode = articleRef.current
          .childNodes[nodeAddress[0]]
          .childNodes[nodeAddress[1]]
          .childNodes[nodeAddress[2]]
      }
    
      caretNode && document.getSelection().collapse(caretNode.lastChild, offset);
    }
  }, [articleState, articleRef])

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

    if (anchorNode.parentNode.localName === 'h1') {
      return {
        offset: anchorOffset < focusOffset ? anchorOffset : focusOffset,
        selection: anchorOffset < focusOffset ? anchorOffset : focusOffset,
        nodeAddress: null,
        selectedRange: [anchorOffset, focusOffset].sort((a, b) => a - b),
      }
    }

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
    const result = {
      ...articleState,
      article: []
    };

    if (headerRef.current) {
      result.h1 = headerRef.current.textContent;
    }

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
        } 
  
        if (childNode.localName === 'br') {
          paragraph.content.push(br)
        }
      }

      result.article.push(paragraph)
      result.caretPosition = selectChange()
    }
    
    setArticleState(result)
    
    // prevent caret blinking at offset 0 after rerender
    document.getSelection().collapse(null)
  }

  const onKeyDown = (e) => {
    const localName = e.target.localName;

    if (localName === 'h1') {
      if (e.keyCode === 13) {
        e.preventDefault()
        setArticleState({
          ...articleState,
          caretPosition: {
            nodeAddress: [0, 0, 0],
            selection: 0,
            offset: 0,
          }
        })
      }
      if (e.keyCode === 8 && e.target.textContent.length === 1) {
        e.preventDefault()
        setArticleState({
          ...articleState,
          h1: zws,
          caretPosition: {
            ...articleState.caretPosition,
            offset: 1,
          }
        })
      }
    }

    if (localName === 'article') {
      const { offset, selection, nodeAddress, selectedRange } = selectChange();

      const kyeDownReducer = (articleState, e) => {
        const isMultiselect = selectedRange[0].length !== 3;

        switch (e.keyCode) {
          case 13:
            if (!isMultiselect) {
              e.preventDefault();
              if (e.shiftKey) {
                return shiftEnter({ 
                  articleState, 
                  selection, 
                  nodeAddress, 
                });
              } else {
                return enter({ 
                  articleState, 
                  selection, 
                  nodeAddress, 
                });
              }
            }
          case 8:
            if (!isMultiselect) {
              return backspace({ 
                articleState, 
                offset, 
                selection, 
                nodeAddress, 
                articleRef, 
                e,
              });
            }
          default:
            if (isMultiselect) {
              // backspace
              if (e.keyCode === 8) {
                e.preventDefault()
                return deleteSelected({
                  articleState, 
                  selectedRange, 
                  offset,
                })
              }

              // enter
              if (e.keyCode === 13) {
                e.preventDefault()
                const { newState, newCaretPosition } = deleteSelected({
                  articleState, 
                  selectedRange, 
                  offset,
                });

                if (e.shiftKey) {
                  return shiftEnter({ 
                    articleState: { article: newState }, 
                    selection: newCaretPosition.selection, 
                    nodeAddress: newCaretPosition.nodeAddress, 
                  });
                } else {
                  return enter({ 
                    articleState: { article: newState }, 
                    selection: newCaretPosition.selection, 
                    nodeAddress: newCaretPosition.nodeAddress, 
                  });
                }
              }

              if ((e.key.length === 1 || e.keyCode === 32) && !(e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                const { newState, newCaretPosition } = deleteSelected({
                  articleState,
                  selectedRange,
                  offset,
                })

                return insertText({
                  articleState: { article: newState },
                  selection: newCaretPosition.selection,
                  text: e.key,
                  offset: newCaretPosition.offset,
                  nodeAddress: newCaretPosition.nodeAddress,
                })
              }
            }
        }
      }

      const result = kyeDownReducer(articleState, e);

      if (result) {
        const { newState, newCaretPosition } = result;
        setArticleState({
          ...articleState,
          caretPosition: newCaretPosition,
          article: newState,
        });
      }
    }
  }
  
  document.onselectionchange = throttle(selectChange, 300);

  return (
    <div className={s.container}>
      <div
        className={s.editor}
        onInput={onArticleChange}
        onKeyDown={onKeyDown}
        onDragStart={e => e.preventDefault()}
      >
        {articleState && 
          <h1
            className={cx({ [s.emptyH1]: (articleState.h1 === zws) })}
            contentEditable={true} 
            suppressContentEditableWarning={true}
            ref={headerRef}
            data-placeholder='Header'
          >
            {articleState.h1}
          </h1>
        }
        <article
          contentEditable={true} 
          suppressContentEditableWarning={true}
          ref={articleRef}
        >
          {articleState && articleState.article.map((item, index) => {
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
                            <span 
                              key={i} 
                              data-spanindex={[index, contentIndex, i]} 
                              style={styles[i].style}
                            >
                              {text.slice(...styles[i].range)}
                            </span>);
                        }
                      } else {
                        if (!index && !contentIndex && text === zws) {
                          result = <span 
                            className={s.emptySpan} 
                            data-placeholder='Text' 
                            data-spanindex={[index, contentIndex, 0]}
                          >
                            {text}
                          </span>
                        } else {
                          result = <span data-spanindex={[index, contentIndex, 0]}>{text}</span>;
                        }
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
    </div>
  )
}

export default Editor;
