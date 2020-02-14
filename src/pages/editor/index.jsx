import React, { useState, useEffect, createRef } from 'react';

import initialState from './initialState';
import throttle from 'utils/throttle';
import s from './styles.module.scss';

const br = 'U+23CE';

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
  
      document.getSelection().collapse(caretNode.lastChild, offset);
    }
  }, [articleState])

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
    if (!anchorNode || !anchorOffset) return;
    const anchorText = anchorNode.data;
    const focusText = focusNode.data;
    const result = [0, 0];
    const { nodeWithDataset, index } = getNodeWithDataset(anchorNode);

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
    
    
    // console.log(articleRef.current.childNodes[nodeAddress[0]].childNodes[nodeAddress[1]].childNodes[nodeAddress[2]])
    // console.log(result.sort((a, b) => a - b))

    // setCaretPosition({
    //   offset: anchorOffset,
    //   selection: isCollapsed ? result[0] : result.sort((a, b) => a - b),
    //   nodeAddress,
    // })

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

    //const { offset, selection, nodeAddress } = selectChange();
    
    setCaretPosition(selectChange())
  }
  
  document.onselectionchange = throttle(selectChange, 300);

  return (
    <div className={s.container}>
      <article
        contentEditable={true} 
        suppressContentEditableWarning={true}
        onInput={onArticleChange}
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
          }
        })}
      </article>
    </div>
  )
}

export default Editor;
