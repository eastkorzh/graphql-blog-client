import React, { useState, useEffect } from 'react';

import s from './styles.module.scss';

// To do
//
// 1) Prevent caret moving to the line begining --done
// 1.1) Track caret position --done
// 1.2) Manualy move caret back --done
//
// 2) Handle new paragraph action
// 2.1) Line breack --done
// 2.2) New paragraph --done
// 2.3) N+1 paragraph error --done
//
// 3) Handle new line action
//
// 4) Handle delete line action --done
//
// 5) Handle multiline delition
//
// Write caret moove reducer


const Editor = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [articleText, setArticleText] = useState(//JSON.parse(localStorage.article) || 
  [
    {tag: "p", content: ["1. Never gonna give you up"]},
    {tag: "p", content: ["2. Never gonna let you down"]},
    {tag: "p", content: ["3. Never gonna run around and desert you", "4. Never gonna make you cry", "5. Never gonna say goodbye", "6. Never gonna tall a lie and hurt you"]}
  ]);
  const ref = React.createRef();
  let keys = [];
  //const range = new Range;

  const getNodeWithDataset = (anchorNode) => {
    let index = null;
    let nodeWithDataset = anchorNode;
  
    while (true) {
      let i = 0;
      if (nodeWithDataset.dataset && nodeWithDataset.dataset.index) {
        index = parseInt(nodeWithDataset.dataset.index);
        break;
      } else {
        if (i < 20) i++ 
        else break;
        nodeWithDataset = nodeWithDataset.parentNode;
      }
    }

    return { index, nodeWithDataset }
  }

  useEffect(() => {
    // const a = JSON.stringify(articleText)
    // if (a) {
    //   localStorage.article = a;
    // }
    if (selectedNode) {
      switch (selectedNode.type) {
        case 'NEW_LINE':
          document.getSelection().collapse(selectedNode.node.nextSibling.firstChild, 0)
          break;
        case 'DELETE_LINE':
          const filteredChildNodes = [];

          for (let node of selectedNode.node.childNodes) {
            if (node.nodeName === '#text') filteredChildNodes.push(node)
          }
          
          document.getSelection().collapse(filteredChildNodes[selectedNode.nodeToFocusIndex], selectedNode.offset)
          break;
        case 'DELETE_EMPTY_PARAGRAPH':
          console.log(selectedNode.node)
          document.getSelection().collapse(selectedNode.node, selectedNode.offset)
          break;
        case 'COLLAPSE_WITH_PREVIOUS':
          //console.log(selectedNode.node)
          break;
        default:
          document.getSelection().collapse(selectedNode.node, selectedNode.offset)
      }
    }
  }, [articleText]);

  const onArticleChange = (e) => {
    const { anchorNode, anchorOffset } = document.getSelection();

    const newState = [];

    for (let node of e.target.children) {
      const content = [];

      for (let child of node.childNodes) {
        if (child.nodeName !== '#text') continue;
        content.push(child.data)
      }

      newState.push({
        tag: node.localName,
        content,
      })
    }

    setArticleText(newState);

    setSelectedNode({ node: anchorNode, offset: anchorOffset })
  }

  const keyDown = (e) => {
    const { anchorNode, anchorOffset } = document.getSelection();
    // Shift + Enter
    if ((e.keyCode === 16 && keys.indexOf(16) === -1) ||
    (e.keyCode === 13 && keys.indexOf(13) === -1)) {
      keys.push(e.keyCode);
    }
    
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

        

        return;
      }
    }
    // Enter
    if (e.keyCode === 13) {
      e.preventDefault();
      
      let index = null;
      let nodeWithDataset = anchorNode;

      while (true) {
        let i = 0;
        if (nodeWithDataset.dataset && nodeWithDataset.dataset.index) {
          index = parseInt(nodeWithDataset.dataset.index);
          break;
        } else {
          if (i < 20) i++ 
          else break;
          nodeWithDataset = nodeWithDataset.parentNode;
        }
      }

      const newState = [];
      let firstContent = [];
      let lastContent = [];
      let i = 0;
      for (let item of articleText[index].content) {
        if (anchorOffset === 0) {
          if (anchorNode.data !==  nodeWithDataset.childNodes[0].textContent) {
            if (item === anchorNode.data) {
              lastContent.push(item);
              continue;
            };
          } else {
            firstContent.push('\u{200B}');
            lastContent = articleText[index].content;
            break;
          }
        }

        if (lastContent.length !== 0) {
          lastContent.push(item);
          continue;
        }

        if (item === anchorNode.data || item === anchorNode.textContent) {
          firstContent.push(item.slice(0, anchorOffset) || '\u{200B}');
          lastContent.push(item.slice(anchorOffset) || '\u{200B}');
        } else {
          firstContent.push(item);
        }
        i++;
      }

      for (let i = 0; i < articleText.length; i++) {
        if (i !== index) {
          newState.push(articleText[i])
        } else {
          newState.push({
            tag: 'p',
            content: firstContent,
          })
          newState.push({
            tag: 'p',
            content: lastContent,
          })
        }
      }
      
      setSelectedNode({ node: nodeWithDataset, offset: anchorOffset, type: 'NEW_LINE' })
      setArticleText(newState);

      return;
    }

    // Backspace
    if (e.keyCode === 8) {
      e.preventDefault();

      const { anchorNode, anchorOffset } = document.getSelection();
      let newState = [];

      if (anchorNode.textContent === '\u{200B}') {
        //console.log('del empty')
        const { index, nodeWithDataset } = getNodeWithDataset(anchorNode);
        console.log(nodeWithDataset.previousSibling.lastChild)
        const newState = articleText.filter((item, i) => i !== index);

        setArticleText(newState);
        setSelectedNode({
          type: 'DELETE_EMPTY_PARAGRAPH',
          node: nodeWithDataset.previousSibling.lastChild,
          offset: nodeWithDataset.previousSibling.lastChild.data.length,
        })
        return;
      }

      if (anchorOffset === 0) {
        const childrens = anchorNode.parentNode.childNodes;
        
        if (anchorNode.data === childrens[0].textContent) {
          const { index, nodeWithDataset } = getNodeWithDataset(anchorNode);
          const newState = [];

          for (let i=0; i<articleText.length; i++) {
            if (i === index) continue;

            if (i === index-1) {
              newState.push({
                ...articleText[i],
                content: articleText[i].content.concat(articleText[i+1].content)
              })
            } else {
              newState.push(articleText[i])
            }
          }
          
          setSelectedNode({
            type: 'COLLAPSE_WITH_PREVIOUS',
            node: nodeWithDataset,
            collapseTo: anchorNode.data,
            offset: 0,
          })
          setArticleText(newState);
        } else {
          const stateToModify = [...articleText];
          const { index, nodeWithDataset } = getNodeWithDataset(anchorNode);
          const content = articleText[index].content;
          const newContent = [];
          let nodeToFocusIndex = null;

          for (let i=0; i<content.length; i++) {
            if (content[i] === anchorNode.data) {
              newContent[i-1] += content[i]
              nodeToFocusIndex = i-1;
            } else {
              newContent.push(content[i])
            }
          }
        
          stateToModify[index] = {
            ...stateToModify[index],
            content: newContent
          }
          
          newState = stateToModify;

          setArticleText(newState);
          setSelectedNode({ 
            type: 'DELETE_LINE',
            node: nodeWithDataset, 
            offset: content[nodeToFocusIndex].length,
            nodeToFocusIndex,
          })
        }

      } else {
        document.execCommand("delete");
      }

      //console.log(newState)
      return;
    }

    // delete keyCode - 46
  }

  const keyUp = (e) => {
    if (e.keyCode === 16 || e.keyCode === 13) {
      keys = keys.filter(item => item !== e.keyCode)
    }
  }

  const focus = () => {
    const nodes = ref.current.children;
    const lastNode = nodes[nodes.length - 1].lastChild

    if (!document.getSelection().anchorNode) {
      document.getSelection().collapse(lastNode, lastNode.length)
    }
  }

  return(
    <div className={s.container} onClick={focus}>
      <article
        onInput={onArticleChange}
        onKeyDown={keyDown}
        onKeyUp={keyUp}
        contentEditable={true} 
        suppressContentEditableWarning={true}
        ref={ref}
      >
        {articleText && articleText.map((item, index) => {
          return React.createElement(
            item.tag || 'p',
            { 
              key: index,
              'data-index': index,
            },
            item.content.map((item, index, arr) => {
              return index === arr.length - 1 ? 
                <React.Fragment key={index}>{item}</React.Fragment> : 
                <React.Fragment key={index}>{item}<br /></React.Fragment>
            }),
          )
        })}
      </article>
    </div>
  )
}

export default Editor;
