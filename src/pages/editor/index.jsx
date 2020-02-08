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
    {tag: "p", content: "Never gonna give you up"},
    {tag: "p", content: "Never gonna let you down"},
    {tag: "p", content: "Never gonna run around and desert you"}
  ]);
  const ref = React.createRef();
  //const range = new Range;

  useEffect(() => {
    // const a = JSON.stringify(articleText)
    // if (a) {
    //   localStorage.article = a;
    // }
    if (selectedNode) {
      if (selectedNode.type === 'NEW_LINE') {
        document.getSelection().collapse(selectedNode.node.nextSibling, 0)
      } else if (selectedNode.type === 'DELETE_LINE') {
        document.getSelection().collapse(selectedNode.node.firstChild, selectedNode.offset)
      } else {
        document.getSelection().collapse(selectedNode.node, selectedNode.offset)
      }
    }
  }, [articleText]);

  const onArticleChange = (e) => {
    const { anchorNode, anchorOffset } = document.getSelection();

    const newState = [];
    for (let node of e.target.children) {
      newState.push({
        tag: node.localName,
        content: node.textContent
      })
    }

    setArticleText(newState);

    setSelectedNode({ node: anchorNode, offset: anchorOffset })
  }

  const keyDown = (e) => {
    const { anchorNode, anchorOffset } = document.getSelection();

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

      const firstPart = articleText[index].content.slice(0, anchorOffset) || '\u{200B}';
      const lastPart = articleText[index].content.slice(anchorOffset) || '\u{200B}';

      const newState = [];

      for (let i = 0; i < articleText.length; i++) {
        if (i !== index) {
          newState.push(articleText[i])
        } else {
          newState.push({
            tag: 'p',
            content: firstPart,
          })
          newState.push({
            tag: 'p',
            content: lastPart,
          })
        }
      }

      setSelectedNode({ node: nodeWithDataset, offset: anchorOffset, type: 'NEW_LINE' })
      setArticleText(newState);
    }

    if (e.keyCode === 8) {
      e.preventDefault();

      const { anchorNode, anchorOffset } = document.getSelection();

      if (anchorOffset !== 0 && anchorNode.data !== '\u{200B}') {
        document.execCommand("delete");
      } else {
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

        if (nodeWithDataset.previousSibling) {
          const newState = [];
          const firstPart = articleText[index-1].content;
          const lastPart = articleText[index].content;
          let result = '';

          if (firstPart === '\u{200B}' && lastPart === '\u{200B}') {
            result = '\u{200B}';
          } else if (lastPart === '\u{200B}') {
            result = firstPart;
          } else if (firstPart === '\u{200B}') {
            result = lastPart;
          } else {
            result = firstPart + lastPart;
          }

          for (let i = 0; i < articleText.length; i++) {
            if (i !== index-1) {
              if (i === index) continue;
              newState.push(articleText[i])
            } else {
              newState.push({
                tag: 'p',
                content: result,
              })
            }
          }
          setArticleText(newState)
          setSelectedNode({ 
            type: 'DELETE_LINE',
            node: nodeWithDataset.previousSibling, 
            offset: firstPart === '\u{200B}' ? 0 : firstPart.length, 
          })
        }
      }
    }
    // delete keyCode - 46
  }

  const focus = () => {
    const nodes = ref.current.children;
    const lastNode = nodes[nodes.length - 1].firstChild

    if (!document.getSelection().anchorNode) {
      document.getSelection().collapse(lastNode, lastNode.length)
    }
  }

  return(
    <div className={s.container} onClick={focus}>
      <article
        onInput={onArticleChange}
        onKeyDown={keyDown}
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
            item.content,
          )
        })}
      </article>
    </div>
  )
}

export default Editor;
