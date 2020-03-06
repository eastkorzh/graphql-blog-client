import React, { useState, useEffect, createRef } from 'react';
import cx from 'classnames';
import shortid from 'shortid';

import { br, zws } from './constants';
import selectionChange from './utils/selectionChange';
import initialState1 from './initialState1';

import insertText from './insertText';
import deleteSelected from './deleteSelected';
import shiftEnter from './shiftEnter';
import enter from './enter';
import backspace from './backspace';

import Close from 'baseui/icon/delete';
import AddPhoto from './addPhoto';
import TextStylesSwitcher from 'components/textStylesSwitcher';
import s from './styles.module.scss';

const Editor = () => {
  //const [articleState, setArticleState] = useState(initialState1);
  const [articleState, setArticleState] = useState({
    h1: zws,
    article: [{
      id: shortid.generate(),
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
      const { nodeAddress, offset, selectedRange } = articleState.caretPosition;

      let caretNode = null;

      if (Array.isArray(offset)) {
        const range = new Range();

        const caretNodeStart = articleRef.current
          .childNodes[selectedRange[0][0]]
          .childNodes[selectedRange[0][1]]
          .childNodes[selectedRange[0][2]]

        const caretNodeEnd = articleRef.current
          .childNodes[selectedRange[1][0]]
          .childNodes[selectedRange[1][1]]
          .childNodes[selectedRange[1][2]]
        
        range.setStart(caretNodeStart.lastChild, offset[0]);
        range.setEnd(caretNodeEnd.lastChild, offset[1]);

        document.getSelection().removeAllRanges();
        document.getSelection().addRange(range);
      } else {
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
    }
  }, [articleState, articleRef])

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
        id: node.dataset.key,
        type: 'text',
        content: []
      }

      if (node.dataset.role === 'img') {
        let img = null;

        for (let item of node.childNodes) {
          if (item.localName === 'img') {
            img = item;
            break;
          }
        }

        result.article.push({
          id: node.dataset.key,
          type: 'img',
          src: img.src,
        })

        continue;
      }

      // itarate paragraphs text blocks
      for (let childNode of node.childNodes) {
        if (childNode.localName === 'span') {
          let styles = [];
          let offset = 0;

          // iterate text blocks spans
          for (let styledNode of childNode.childNodes) {
            const { fontWeight, fontStyle } = styledNode.style;
            
            if (!styledNode.style.length && childNode.childNodes.length === 1) {
              styles = null;
            } else {
              styles.push({
                style: {
                  fontWeight,
                  fontStyle,
                },
                range: [offset, offset+styledNode.textContent.length]
              })
              offset += styledNode.textContent.length;
            }
          }
          
          paragraph.content.push({
            text: childNode.textContent,
            styles,
            id: childNode.dataset.key,
          })
        }

        if (childNode.localName === 'br') {
          paragraph.content.push(br)
        }
      }
      result.article.push(paragraph)
      result.caretPosition = selectionChange()
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
      const { offset, selection, nodeAddress, selectedRange } = selectionChange();

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

  const deleteImage = (index) => {
    const stateCopy = {...articleState};

    stateCopy.article = stateCopy.article.filter((item, i) => i !== index);

    setArticleState({
      ...stateCopy,
      caretPosition: null,
    })

    document.getSelection().collapse(null);
  }
  
  return (
    <div className={s.container}>
      <TextStylesSwitcher articleState={articleState} setArticleState={setArticleState}/>
      <div
        className={s.editor}
        onInput={onArticleChange}
        onKeyDown={onKeyDown}
        onDragStart={e => e.preventDefault()}
      >
        <AddPhoto articleState={articleState} setArticleState={setArticleState} articleRef={articleRef} />
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
            if (item.type === 'img') {
              return (
                <div className={s.image} key={item.id} data-key={item.id} data-role={'img'}>
                  <div className={s.delete} onClick={() => deleteImage(index)}>
                    <Close size={30} />
                  </div>
                  <img 
                    style={{ maxWidth: '100%'}} 
                    src={item.src} 
                    alt=""
                    contentEditable={false} 
                  />
                </div>
              )
            }
            if (item.type === 'text') {
              return (
                <p data-index={index} key={item.id} data-key={item.id}>
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
                              key={`${item.id}-${contentIndex}-${i}`} 
                              data-key={`${item.id}-${contentIndex}-${i}`}
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
                          key={`${item.id}-${contentIndex}`} 
                          data-key={`${item.id}-${contentIndex}`}
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
