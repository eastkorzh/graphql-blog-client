import React, { useEffect, useState } from 'react';

import throttle from 'utils/throttle';
import selectionChange from 'pages/editor/utils/selectionChange'
import s from './styles.module.scss';

const TextStylesSwitcher = ({ articleState }) => {
  const [selection, setSelection] = useState();

  const ejectStyles = (articleState, selection, ejectingStyles) => {
    const { nodeAddress, selectedRange } = selection;
    
    const firstSelected = selectedRange[0];
    const lastSelected = selectedRange[1];
    
    const nodeCopy = {...articleState.article[firstSelected[0]].content[firstSelected[1]]};

    if (firstSelected[1] === lastSelected[1]) {
      if (nodeCopy.styles) {
        const newStyles = [];

        for (let i=0; i<nodeCopy.styles.length; i++) {
          const currentStyle = nodeCopy.styles[i];
          
          const aL = firstSelected[3];
          const aR = lastSelected[3];

          const bL = currentStyle.range[0];
          const bR = currentStyle.range[1];

          if (aR <= bL) {
            newStyles.push(currentStyle);
            continue;
          }

          if (bR <= aL) {
            newStyles.push(currentStyle);
            continue;
          }
          
          if (bL <= aL && aR <= bR) {
            if (bL !== aL) newStyles.push({
              ...currentStyle,
              range: [bL, aL]
            })

            newStyles.push({
              ...currentStyle,
              style: {
                ...currentStyle.style,
                ...ejectingStyles,
              },
              range: [aL, aR]
            })

            if (aR !== bR) newStyles.push({
              ...currentStyle,
              range: [aR, bR]
            })
          }

          // a - selected range, b - current style range
          //              aL ____ aR
          //       bL ________ bR

          if (bL < aL && aL < bR && bR < aR) {
            newStyles.push({
              ...currentStyle,
              range: [bL, aL],
            })
            newStyles.push({
              ...currentStyle,
              style: {
                ...currentStyle.style,
                ...ejectingStyles,
              },
              range: [aL, bR],
            })
          }

          if (aL < bL && aR > bL && aR < bR) {
            newStyles.push({
              ...currentStyle,
              style: {
                ...currentStyle.style,
                ...ejectingStyles,
              },
              range: [bL, aR],
            })
            newStyles.push({
              ...currentStyle,
              range: [aR, bR],
            })
          }
        }

        console.log(newStyles)
      }
    }
  }

  const bold = () => {
    ejectStyles(articleState, selection, { fontWeight: 'bold'})
  }

  const onSelectionChange = () => {
    setSelection(selectionChange());
  }

  document.onselectionchange = throttle(onSelectionChange, 300);

  return (
    <div className={s.container}>
      <button onClick={bold}>
        bold
      </button>
    </div>
  )
}

export default TextStylesSwitcher;
