import React, { useState, useEffect, createRef, useCallback } from 'react';
import cx from 'classnames';
import shortid from 'shortid';
import { useLazyQuery, useMutation } from '@apollo/react-hooks';

import { br, zws } from './constants';
import selectionChange from './utils/selectionChange';
import initialState1 from './initialState1';
import throttle from 'utils/throttle';

import insertText from './insertText';
import deleteSelected from './deleteSelected';
import shiftEnter from './shiftEnter';
import enter from './enter';
import backspace from './backspace';

import EditorHeader from './editorHeader';
import { toaster, ToasterContainer, PLACEMENT } from "baseui/toast";
import { Spinner } from "baseui/spinner";
import Close from 'baseui/icon/delete';
import AddPhoto from './addPhoto';
import TextStylesSwitcher from './textStylesSwitcher';
import s from './styles.module.scss';
import gql from 'graphql-tag';

const articleRef = createRef();
const headerRef = createRef();

const GET_DRAFT = gql`
  query Draft($_id: ID!) {
    draft(_id: $_id) {
      _id
      title
      content
      date
      cover
      originalPost
    }
  }
`
const GET_POST = gql`
  query Post($_id: ID!) {
    post(_id: $_id) {
      _id
      content
    }
  }
`

const UPDATE_DRAFT = gql`
  mutation updateDraft(
    $_id: ID!
    $title: String
    $content: String
    $cover: String
  ) {
    updateDraft(
      _id: $_id
      title: $title
      content: $content
      cover: $cover
    ) {
      _id
      title
      content
      date
      cover
    }
  }
`

const Editor = ({ match, history }) => {
  const [ getDraft, { data: draftContent, loading: draftLoading } ] = useLazyQuery(GET_DRAFT, {
    onError({ message }) {
      toaster.negative(message)
    }
  });
  const [ getPost, { data: postContent, loading: postLoading } ] = useLazyQuery(GET_POST, {
    onError({ message }) {
      toaster.negative(message)
    }
  });
  const [ updateDraft ] = useMutation(UPDATE_DRAFT, {
    onError({ message }) {
      toaster.negative(message)
    }
  });

  const initialState = {
    h1: zws,
    article: [{
      id: shortid.generate(),
      type: 'text',
      content: [{
        text: zws,
        styles: null
      }]
    }]
  }

  const [ articleHistory, setArticleHistory ] = useState([]);
  const [ articleState, setArticleState ] = useState(null);
  const [ ignoreCacheUpdate, setIgnoreCacheUpdate ] = useState(true);
  const [ ignoreDraftUpdate, setIgnoreDraftUpdate ] = useState(true);
  const [ editingMode ] = useState(match.path === "/editor/draft/:id");

  useEffect(() => {
    const _id = match.params.id;
    
    if (match.path === "/editor/draft/:id") {
      getDraft({ variables: { _id }})
    }
    if (match.path === "/editor/post/:id" || match.path === '/post/:id') {
      getPost({ variables: { _id }});
    }
  }, [])

  useEffect(() => {
    if (postContent) {
      const content = JSON.parse(postContent.post.content);

      if (typeof content === 'object' && content !== null) {
        setArticleState(content)
      }
    }
    
  }, [postContent])

  useEffect(() => {
    if (draftContent && ignoreCacheUpdate) {
      const content = JSON.parse(draftContent.draft.content);

      if (typeof content === 'object' && content !== null) {
        setArticleState(content)
      } else {
        setArticleState(initialState)
      }

      setIgnoreCacheUpdate(false)
    }
  }, [draftContent, ignoreCacheUpdate])

  const throttledSetArticleHistory = useCallback(throttle(
    (state, history) => {
      if (history.length >= 15) {
        history.shift()
      }
      
      setArticleHistory([
        ...history,
        state,
      ]);
    },
    500
  ), [])

  const throttledUpdateDraft = useCallback(throttle(
    (_id, articleStateJSON, articleStateCopy) => {
      let cover = null;
      for (let item of articleStateCopy.article) {
        if (item.type === 'img' && item.src.slice(0, 4) === 'http') {
          cover = item.src;
          break;
        }
      }
      
      updateDraft({ variables: {
        _id,
        title: articleStateCopy.h1,
        content: articleStateJSON,
        cover,
      }})
    },
    1000
  ), [])

  useEffect(() => {
    if (articleState) {
      const articleStateJSON = JSON.stringify(articleState);
      const articleStateCopy = JSON.parse(articleStateJSON);

      throttledSetArticleHistory(articleStateCopy, articleHistory);
      if (!ignoreDraftUpdate) throttledUpdateDraft(match.params.id, articleStateJSON, articleStateCopy);
    }
  }, [articleState, ignoreDraftUpdate])
  
  useEffect(() => {
    if (articleState && articleState.caretPosition && editingMode) {
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
    if (ignoreDraftUpdate) setIgnoreDraftUpdate(false);

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
            const { fontWeight, fontStyle, textDecoration } = styledNode.style;
            
            if (!styledNode.style.length && childNode.childNodes.length === 1) {
              styles = null;
            } else {
              styles.push({
                style: {
                  fontWeight,
                  fontStyle,
                  textDecoration,
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
    if (ignoreDraftUpdate) setIgnoreDraftUpdate(false);

    const localName = e.target.localName;

    // Ctrl+Z
    if (e.keyCode === 90 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (articleHistory.length > 1) {
        setArticleState(articleHistory[articleHistory.length-2]);
        const newArticleHistory = [...articleHistory];
        newArticleHistory.pop();
        newArticleHistory.pop();
        setArticleHistory(newArticleHistory)
      }
    }
    
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
        return;
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
        return;
      }
    }

    if (localName === 'article') {
      const selected = selectionChange();
      if (!selected) {
        e.preventDefault();
        document.getSelection().collapse(null)
        return;
      };  
      const { offset, nodeAddress, selection, selectedRange } = selected;

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

  const paste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text/plain');

    const selected = selectionChange();
    if (!selected) {
      e.preventDefault();
      document.getSelection().collapse(null)
      return;
    };  
    const { offset, nodeAddress, selection, selectedRange } = selected;
    
    if (selectedRange[0].length > 3) {
      const { newState, newCaretPosition } = deleteSelected({
        articleState,
        selectedRange,
        offset,
      })

      const { newState: resultState, newCaretPosition: resultCaretPosition } = insertText({
        articleState: { article: newState },
        selection: newCaretPosition.selection,
        text: clipboardData,
        offset: newCaretPosition.offset,
        nodeAddress: newCaretPosition.nodeAddress,
      })
  
      setArticleState({
        ...articleState,
        article: resultState,
        caretPosition: resultCaretPosition,
      })
    } else {
      const { newState, newCaretPosition } = insertText({
        articleState,
        selection: selection,
        text: clipboardData,
        offset: offset,
        nodeAddress: nodeAddress,
      })
  
      setArticleState({
        ...articleState,
        article: newState,
        caretPosition: newCaretPosition,
      })
    }
  }

  return (
    <ToasterContainer placement={PLACEMENT.bottomRight} >
      <div className={s.container}>
      <EditorHeader match={match} history={history}/>
      {articleState &&
        <>
          <div
            className={s.editor}
            onInput={onArticleChange}
            onKeyDown={onKeyDown}
            onDragStart={e => e.preventDefault()}
          >
            {editingMode &&
              <>
                <TextStylesSwitcher articleState={articleState} setArticleState={setArticleState} articleRef={articleRef} />
                <AddPhoto articleState={articleState} setArticleState={setArticleState} articleRef={articleRef} />
              </>
            }
            {(articleState && !draftLoading) && 
              <h1
                className={cx({ [s.emptyH1]: (articleState.h1 === zws) })}
                contentEditable={editingMode} 
                suppressContentEditableWarning={true}
                ref={headerRef}
                data-placeholder='Header'
              >
                {articleState.h1}
              </h1>
            }
            <article
              contentEditable={editingMode} 
              suppressContentEditableWarning={true}
              ref={articleRef}
              onPaste={e => paste(e)}
              style={editingMode ? {marginBottom: '40vh'} : {}}
            >
              {(articleState && !draftLoading) && articleState.article.map((item, index) => {
                if (item.type === 'img') {
                  return (
                    <div contentEditable={false} className={s.image} key={item.id} data-key={item.id} data-role={'img'}>
                      {editingMode &&
                        <div className={s.delete} onClick={() => deleteImage(index)}>
                          <Close size={30} />
                        </div>
                      }
                      {(item.src.slice(0, 4) === 'blob') &&
                        <div contentEditable={false} className={s.loading}>
                          <Spinner color="#e2e2e2" size={40}/>
                        </div>
                      }
                      <img 
                        style={{ maxWidth: '100%'}} 
                        src={item.src} 
                        alt=""
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
        </>
      }
      </div>
    </ToasterContainer>
  )
}

export default Editor;
