import React, { useEffect, useState } from 'react';

import { br } from 'pages/editor/constants';
import throttle from 'utils/throttle';
import selectionChange from 'pages/editor/utils/selectionChange';
import updateNode from './updateNode';
import concatSameStyles from './concatSameStyles';

import s from './styles.module.scss';

const TextStylesSwitcher = ({ articleState, setArticleState }) => {
  const [selection, setSelection] = useState();

  const ejectStyles = (articleState, selection, ejectingStyles) => {
    if (!selection) return;
    const { selectedRange } = selection;
    if (selectedRange[0].length < 4) return;
    
    const stateCopy = {...articleState};

    for (let i=selectedRange[0][0]; i<=selectedRange[1][0]; i++) {
      if (stateCopy.article[i].type !== 'text') continue;
      
      const content = stateCopy.article[i].content;
      
      if (i === selectedRange[0][0]) {
        // selection only inside the paragraph
        if (selectedRange[0][0] === selectedRange[1][0]) {
          for (let j=selectedRange[0][1]; j<=selectedRange[1][1]; j++) {
            if (content[j] !== br) {
              if (j === selectedRange[0][1] && j === selectedRange[1][1]) {
                content[j] = updateNode({
                  nodeCopy: {...content[j]},
                  aL: selectedRange[0][3],
                  aR: selectedRange[1][3],
                  ejectingStyles,
                })
                continue;
              }

              if (j === selectedRange[0][1]) {
                content[j] = updateNode({
                  nodeCopy: {...content[j]},
                  aL: selectedRange[0][3],
                  aR: content[j].text.length,
                  ejectingStyles,
                })
                continue;
              }

              if (j < selectedRange[1][1]) {
                content[j] = updateNode({
                  nodeCopy: {...content[j]},
                  aL: 0,
                  aR: content[j].text.length,
                  ejectingStyles,
                })
                continue;
              }

              if (j === selectedRange[1][1]) {
                content[j] = updateNode({
                  nodeCopy: {...content[j]},
                  aL: 0,
                  aR: selectedRange[1][3],
                  ejectingStyles,
                })
                continue;
              }
            }
          }
        } else {
          // selection not only inside the paragraph
          for (let j=selectedRange[0][1]; j<content.length; j++) {
            const node = content[j];
            if (node !== br) {
              if (j === selectedRange[0][1]) {
                content[j] = updateNode({
                  nodeCopy: {...content[j]},
                  aL: selectedRange[0][3],
                  aR: content[j].text.length,
                  ejectingStyles,
                })
                continue;
              } else {
                content[j] = updateNode({
                  nodeCopy: {...content[j]},
                  aL: 0,
                  aR: content[j].text.length,
                  ejectingStyles,
                })
                continue;
              }
            }
          }
        }
        continue;
      }

      // selection overlap the paragraph with both sides
      if (i < selectedRange[1][0]) {
        for (let j=0; j<content.length; j++) {
          const node = content[j];
          if (node !== br) {
            content[j] = updateNode({
              nodeCopy: {...content[j]},
              aL: 0,
              aR: content[j].text.length,
              ejectingStyles,
            })
          }
        }
        continue;
      }

      // selection selection overlap top of paragraph
      if (i === selectedRange[1][0]) {
        for (let j=0; j<= selectedRange[1][1]; j++) {
          const node = content[j];
          if (node !== br) {
            if (j === selectedRange[1][1]) {
              content[j] = updateNode({
                nodeCopy: {...content[j]},
                aL: 0,
                aR: selectedRange[1][3],
                ejectingStyles,
              })
              continue;
            } else {
              content[j] = updateNode({
                nodeCopy: {...content[j]},
                aL: 0,
                aR: content[j].text.length,
                ejectingStyles,
              })
              continue;
            }
          }
        }
      }
    }

    let newCaretPosition = {
      offset: [],
      selectedRange: [],
    };

    const firstSelectedNode = stateCopy.article[selectedRange[0][0]].content[selectedRange[0][1]];
    const lastSelectedNode = stateCopy.article[selectedRange[1][0]].content[selectedRange[1][1]];

    for (let i=0; i<firstSelectedNode.styles.length; i++) {
      const style = firstSelectedNode.styles[i];
     
      if (style.range[1] > selectedRange[0][3]) {
        newCaretPosition.selectedRange.push([selectedRange[0][0], selectedRange[0][1], i, selectedRange[0][3]]);
        newCaretPosition.offset.push(selectedRange[0][3] - style.range[0])
        break;
      }
    }
    
    for (let i=0; i<lastSelectedNode.styles.length; i++) {
      const style = lastSelectedNode.styles[i];
      const prevStyle = i && lastSelectedNode.styles[i-1];

      if (i === lastSelectedNode.styles.length - 1) {
        newCaretPosition.selectedRange.push([selectedRange[1][0], selectedRange[1][1], i, selectedRange[1][3]]);
        newCaretPosition.offset.push(selectedRange[1][3] - style.range[0]);
        break;
      }

      if (style.range[1] > selectedRange[1][3]) {
        newCaretPosition.selectedRange.push([selectedRange[1][0], selectedRange[1][1], i-1, selectedRange[1][3]]);
        newCaretPosition.offset.push(selectedRange[1][3] - prevStyle.range[0]);
        break;
      }
    }
    
    setArticleState({
      ...stateCopy,
      caretPosition: newCaretPosition,
    })
  }

  const bold = () => {
    ejectStyles(articleState, selection, { fontWeight: 'bold' })
  }

  const italic = () => {
    ejectStyles(articleState, selection, { fontStyle: 'italic' })
  }

  const onSelectionChange = () => {
    setSelection(selectionChange());
  }

  useEffect(() => {
    const throttledSelectionChange = throttle(onSelectionChange, 300);
    document.addEventListener('selectionchange', throttledSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', throttledSelectionChange);
    }
  }, [])

  return (
    <div className={s.container}>
      <button onClick={bold}>
        B
      </button>
      <button onClick={italic}>
        i
      </button>
    </div>
  )
}

export default TextStylesSwitcher;
