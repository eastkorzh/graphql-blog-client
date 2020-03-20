import React, { useEffect, useState } from 'react';

import { br } from 'pages/editor/constants';
import throttle from 'utils/throttle';
import selectionChange from 'pages/editor/utils/selectionChange';
import updateNode from './updateNode';
import getContinuousStyles from './getContinuousStyles';
import concatSameStyles from './concatSameStyles';

import s from './styles.module.scss';

const TextStylesSwitcher = ({ articleState, setArticleState, articleRef }) => {
  const [ selection, setSelection ] = useState();
  const [ coords, setCoords ] = useState(null);

  const ejectStyles = (articleState, selection, ejectingStyles) => {
    if (!selection) return;
    const { selectedRange } = selection;
    if (selectedRange[0].length < 4) return;
    
    const stateCopy = {...articleState};

    // if styles is already applied, remove it
    const ejectingStylesKey = Object.keys(ejectingStyles)[0];

    if (selection.continuousStyles && selection.continuousStyles[ejectingStylesKey] === ejectingStyles[ejectingStylesKey]) {
      ejectingStyles[ejectingStylesKey] = '';
    }
    // --------------------------------------
    
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

  const onSelectionChange = (articleState) => {
    const selectionChangeResult = selectionChange();
    const continuousStyles = getContinuousStyles(selectionChangeResult, articleState);

    if (selectionChangeResult) {
      const result = {
        ...selectionChangeResult,
        continuousStyles,
      }
      setSelection(result);
    }
  }

  useEffect(() => {
    const throttledSelectionChange = throttle((articleState) => onSelectionChange(articleState), 300);
    const res = () => throttledSelectionChange(articleState);
    
    document.addEventListener('selectionchange', res);
    return () => {
      document.removeEventListener('selectionchange', res);
    }
  }, [articleState])

  useEffect(() => {
    if (selection && selection.selectedRange[0].length > 3) {
      const { selectedRange } = selection;

      const caretNodeStart = articleRef.current
        .childNodes[selectedRange[0][0]]
        .childNodes[selectedRange[0][1]]
        .childNodes[selectedRange[0][2]]
      
      const left = selectedRange[0][3]/74;
      const top = caretNodeStart.getBoundingClientRect().top - articleRef.current.parentNode.getBoundingClientRect().top - 60;
      
      setCoords({
        top,
        left: (left - Math.floor(left))*100+'%',
      });
    } else {
      if (coords) setCoords(null)
    }
  }, [selection])

  const showActive = (selection, ejectingStyles) => {
    if (!selection.continuousStyles) return ejectingStyles;

    const ejectingStylesKey = Object.keys(ejectingStyles)[0];
    if (selection.continuousStyles[ejectingStylesKey] === ejectingStyles[ejectingStylesKey]) {
      return {
        ...ejectingStyles,
        background: 'rgb(194, 194, 194)',
      };
    } else return ejectingStyles;
  }

  const bold = () => {
    ejectStyles(articleState, selection, { fontWeight: 'bold' })
  }

  const italic = () => {
    ejectStyles(articleState, selection, { fontStyle: 'italic' })
  }

  const underline = () => {
    ejectStyles(articleState, selection, { textDecoration: 'underline'})
  }
  
  const lineThrough = () => {
    ejectStyles(articleState, selection, { textDecoration: 'line-through'})
  }

  const h3 = () => {
    ejectStyles(articleState, selection, { fontSize: '24px' })
  }

  return (
    <>
      {coords &&
        <div className={s.container} style={{ top: coords.top, left: coords.left }}>
          <button onClick={bold} style={showActive(selection, { fontWeight: 'bold' })} >
            B
          </button>
          <button onClick={italic} style={showActive(selection, { fontStyle: 'italic' })} >
            i
          </button>
          <button onClick={underline} style={showActive(selection, { textDecoration: 'underline' })} >
            U
          </button>
          <button onClick={lineThrough} style={showActive(selection, { textDecoration: 'line-through' })} >
            S
          </button>
          <button onClick={h3} style={showActive(selection, { fontSize: '24px' })} >
            h3
          </button>
        </div>
      }
    </>
  )
}

export default TextStylesSwitcher;
