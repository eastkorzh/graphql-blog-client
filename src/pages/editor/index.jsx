import React, { useState, useEffect, createRef } from 'react';

import s from './styles.module.scss';

const Editor = () => {
  const [articleText, setArticleText] = useState(`Some text /n kalsdjf`);
  const ref = createRef();
  const range = new Range;

  useEffect(() => {
    console.log(articleText)
  }, [articleText]);

  const onArticleChange = () => {
    const elements = ref.current.children;

    let content = "";

    for (let elem of elements) {
      const textParts = elem.innerHTML.split('\n');

      if (textParts.length === 2) {
        //elem.innerHTML = textParts[0] + '<br />' + textParts[1];
      }
    }

    //console.log(content)
    //setArticleText(content)
  }

  return(
    <div className={s.container}>
      <article ref={ref} onKeyUp={onArticleChange}>
        <p 
          onKeyDown={e => {
            if (e.keyCode === 13) {
              e.preventDefault();
              const { anchorNode, anchorOffset } = document.getSelection();
              let newEmptyLine = false;
              if (anchorOffset === 0) {
                console.log(anchorNode);
                return;
              };
              // console.log('anchorNode: ', anchorNode, anchorNode.parentNode.localName)
              // console.log(e.target.textContent)
              if (anchorNode.parentNode.localName === 'p') {
                range.selectNode(anchorNode);
                let newNode = document.createElement('span');
                newNode.innerHTML = anchorNode.data;
                try {
                  range.deleteContents();
                  range.insertNode(newNode);
                } catch(e) { alert(e) }
              }

              if (!anchorNode.data || anchorNode.data.length === anchorOffset) {
                newEmptyLine = true;
              }
              if (!anchorNode.data) return;

              const firstPart = anchorNode.data.slice(0, anchorOffset);
              const lastPart = anchorNode.data.slice(anchorOffset);
              let nodeNum = null;
   
              if (e.target.children.length === 0) {
                e.target.outerHTML = `<span>${firstPart}</span><br /><span>${lastPart}</span>`;
              } else {
                for (let i = 0; i < e.target.children.length; i++) {
                  const node = e.target.children[i];
                  
                  if (node === anchorNode.data || node.innerHTML === anchorNode.data) {
                    nodeNum = i;
                    if (newEmptyLine) {
                      node.outerHTML = `<span>${firstPart}</span><br /><br />`;
                    } else {
                      node.outerHTML = `<span>${firstPart}</span><br /><span>${lastPart}</span>`;
                    }
                  }     
                }
              }
            
              //set caret to the position where Enter was pressed
              let caretPositionNode = null;

              if (newEmptyLine) {
                caretPositionNode = e.target.children[nodeNum + 2];
              } else {
                caretPositionNode = e.target.children.length ? 
                  e.target.children[nodeNum].firstChild :
                  e.target.firstChild;
              }

              if (caretPositionNode) {
                console.log(caretPositionNode, caretPositionNode.length || 0)
                document.getSelection().collapse(caretPositionNode, caretPositionNode.length || 0);
              }
            }
          }}
          className={s.editableP} 
          contentEditable={true}
        >
          <span>textToEdit</span>
        </p>
        {/* {articleText} */}
      </article>
    </div>
  )
}

export default Editor;
