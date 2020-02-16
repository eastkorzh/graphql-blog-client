import React, { useState, useEffect, createRef } from 'react';

import initialState from './initialState';
import throttle from 'utils/throttle';
import s from './styles.module.scss';

const br = 'U+23CE';
const zws = '\u200B' //zero width space

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
    if (anchorNode === null) return;
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
  }

  const onKeyDown = (e) => {
    const { offset, selection, nodeAddress } = selectChange()

    const caretNode = articleRef.current
        .childNodes[nodeAddress[0]]
        .childNodes[nodeAddress[1]]
        .childNodes[nodeAddress[2]]

    // Enter
    if (e.keyCode === 13) {
      e.preventDefault();
      const nodeCopy = articleState[nodeAddress[0]].content[nodeAddress[1]];
      const firstPartText = nodeCopy.text.slice(0, selection) || zws;
      const lastPartText = nodeCopy.text.slice(selection) || zws;
      
      let firstPartStyles = []
      let lastPartStyles = []

      if (nodeCopy.styles) {
        for (let item of nodeCopy.styles) {
          if (item.range[1] <= selection) {
            firstPartStyles.push(item);
            continue;
          }

          if (item.range[0] < selection && item.range[1] > selection) {
            firstPartStyles.push({
              ...item,
              range: [item.range[0], selection]
            });
            lastPartStyles.push({
              ...item,
              range: [0, item.range[1] - selection]
            })
            continue;
          }

          if (item.range[0] >= selection) {
            lastPartStyles.push(item)
            continue;
          }
        }
      }

      if (!firstPartStyles.length) firstPartStyles = null;
      if (!lastPartStyles.length) lastPartStyles = null;

      const result = [];

      for (let paragraphIndex=0; paragraphIndex<articleState.length; paragraphIndex++) {
        const paragraph = articleState[paragraphIndex];

        if (paragraphIndex !== nodeAddress[0]) {
          result.push(paragraph)
        } else {
          const firstPartContent = [];
          const lastPartContent = [];

          for (let contentIndex=0; contentIndex<paragraph.content.length; contentIndex++) {
            if (contentIndex !== nodeAddress[1]) {
              if (contentIndex <= nodeAddress[1]) {
                // prevent <br /> insertion at the paragraph ending
                if (selection === 0 && nodeAddress[1]-1 === contentIndex && paragraph.content[contentIndex] === br) continue;
                firstPartContent.push(paragraph.content[contentIndex])
              } else {
                lastPartContent.push(paragraph.content[contentIndex])
              }
            } else {
              if (!(selection === 0 && nodeAddress[1] > 0)) {
                firstPartContent.push({
                  text: firstPartText,
                  styles: firstPartStyles,
                });
              }

              lastPartContent.push({
                text: lastPartText,
                styles: lastPartStyles,
              });
            }
          }
          
          result.push({
            type: 'text',
            content: firstPartContent,
          });       
          
          result.push({
            type: 'text',
            content: lastPartContent,
          });
        }
      }

      setArticleState(result);
      setCaretPosition({
        offset: 0,
        selection: 0,
        nodeAddress: [nodeAddress[0]+1, 0, 0]
      })
    }

    // Backspace
    if (e.keyCode === 8) {
      // caret at begining
      if (offset === 0) {
        e.preventDefault();
        const stateCopy = [...articleState];

        // callapse paragraph with zws paragraph
        if (stateCopy[nodeAddress[0]-1].content[0].text === zws) {
          const result = [];
          const newNodeAddress = [nodeAddress[0]-1, 0, 0];

          for (let paragraphIndex=0; paragraphIndex<stateCopy.length; paragraphIndex++) {
            if (paragraphIndex !== nodeAddress[0]-1) result.push(stateCopy[paragraphIndex])
          }

          setArticleState(result);
          setCaretPosition({
            offset: 0,
            selection: 0,
            nodeAddress: newNodeAddress,
          })
          return;
        }

        // collapse two paragraphs
        if (nodeAddress[1] === 0 && nodeAddress[0] !== 0) {
          const paragraphCopy = stateCopy[nodeAddress[0]]
          const prevParagraphCopy = stateCopy[nodeAddress[0]-1]
          const newNodeAddress = [nodeAddress[0]-1, prevParagraphCopy.content.length+1, 0]
          const result = [];
          
          prevParagraphCopy.content.push(br);
          prevParagraphCopy.content = prevParagraphCopy.content.concat(paragraphCopy.content);

          for (let paragraphIndex=0; paragraphIndex<stateCopy.length; paragraphIndex++) {
            if (paragraphIndex === nodeAddress[0]) continue;
            if (paragraphIndex === nodeAddress[0]-1) {
              result.push(prevParagraphCopy);
            } else {
              result.push(stateCopy[paragraphIndex]);
            }
          }

          setArticleState(result);
          setCaretPosition({
            offset: 0,
            selection: 0,
            nodeAddress: newNodeAddress,
          })
        } 

        // collapse two lines
        if(nodeAddress[1] !== 0) {
          console.log('line clps')
        }
      }

      // caret in text in front of span
      if (offset === 1 && caretNode.textContent.length === 1) {
        e.preventDefault()

        const stateCopy = [...articleState];
        const nodeCopy = stateCopy[nodeAddress[0]].content[nodeAddress[1]];
        
        if (nodeCopy.text.length !== 1) {
          nodeCopy.text = nodeCopy.text.slice(0, nodeCopy.text.length - 1);
        } else {
          nodeCopy.text = zws;
          stateCopy[nodeAddress[0]].content[nodeAddress[1]] = nodeCopy;
          setArticleState(stateCopy);
          return;
        }

        if (nodeCopy.styles !== null) {
          nodeCopy.styles = nodeCopy.styles.filter((item, index) => index !== nodeAddress[2])
        }
        
        stateCopy[nodeAddress[0]].content[nodeAddress[1]] = nodeCopy;

        if (nodeAddress[2] > 0) {
          setCaretPosition({
            offset: articleRef.current
            .childNodes[nodeAddress[0]]
            .childNodes[nodeAddress[1]]
            .childNodes[nodeAddress[2] - 1].lastChild.length,
            selection: selection - 1,
            nodeAddress: [nodeAddress[0], nodeAddress[1], nodeAddress[2] - 1]
          })
        }

        setArticleState(stateCopy)
      }
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
