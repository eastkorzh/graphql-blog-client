const getContinuousStyles = (selectionChange, articleState) => {
  if (articleState && selectionChange && !selectionChange.selection) {
    const firstSelected = selectionChange.selectedRange[0];
    const lastSelected = selectionChange.selectedRange[1];
    let uniqueStyles = {};

    const filterStyles = ({ p, i, j, lineIndex, spanIndex, lineStyles }) => {
      // make first selected styles unique to compare next styles with this one
      if (!lineStyles) return;
      
      if (j === spanIndex && i === lineIndex && !(p > firstSelected[0] && p === lastSelected[0])) {
        let hasStyles = false;

        for (let key in lineStyles[j].style) {
          const item = lineStyles[j].style[key];
          if (item !== '') hasStyles = true;
        }
        if (hasStyles) {
          uniqueStyles = { ...lineStyles[j].style };
        } else {
          uniqueStyles = {};
        }
      } else {
        // updating unique styles to compare next styles with updated one
        let newUniqueSytles = {};

        for (let key in uniqueStyles) {
          if (uniqueStyles[key] === lineStyles[j].style[key]) {
            newUniqueSytles = {
              ...newUniqueSytles,
              [key]: uniqueStyles[key],
            }
          }
        }

        uniqueStyles = { ...newUniqueSytles };
      }
    }

    const iterateOverLines = ({ firstSelectedLine, lastSelectedLine, firstSelectedSpan, lastSelectedSpan, p }) => {
      // iterate over text lines in one paragraph
      for (let i=firstSelectedLine; i<=lastSelectedLine; i+=2) {
        const lineStyles = articleState.article[p].content[i].styles;
        
        if (!lineStyles) {
          uniqueStyles = {};
          return;
        };

        // filter styles in one line
        if (firstSelectedLine === i && lastSelectedLine === i) {
          for (let j=firstSelectedSpan; j<=lastSelectedSpan; j++) {
            filterStyles({ p, i, j, lineIndex: firstSelectedLine, spanIndex: firstSelectedSpan, lineStyles });
          }
        }
        
        // first line filtering of several
        if (firstSelectedLine === i && lastSelectedLine > i) {
          // first line from selected to the end
          for (let j=firstSelectedSpan; j<lineStyles.length; j++) {
            filterStyles({ i, j, lineIndex: firstSelectedLine, spanIndex: firstSelectedSpan, lineStyles });
          }
        }
  
        // filter middle lines
        if (firstSelectedLine < i && lastSelectedLine > i) {
          for (let j=0; j<lineStyles.length; j++) {
            filterStyles({ i, j, lineIndex: firstSelectedLine, spanIndex: firstSelectedSpan, lineStyles });
          }
        }
  
        // filter last lines
        if (firstSelectedLine < i && lastSelectedLine === i) {
          for (let j=0; j<=lastSelectedSpan; j++) {
            filterStyles({ i, j, lineIndex: firstSelectedLine, spanIndex: firstSelectedSpan, lineStyles });
          }
        }
      }
    }

    // iterate over paragraphs
    for (let p=firstSelected[0]; p<=lastSelected[0]; p++) {
      const currentContent = articleState.article[p].content;
      if (!currentContent) continue;

      if (firstSelected[0] === lastSelected[0]) {
        iterateOverLines({ 
          firstSelectedLine: firstSelected[1],
          lastSelectedLine: lastSelected[1],
          firstSelectedSpan: firstSelected[2],
          lastSelectedSpan: lastSelected[2],
          p
        })
        continue;
      }
      
      // current paragraph is first of many
      if (p === firstSelected[0] && lastSelected[0] > p) {
        if (!currentContent[currentContent.length-1].styles) return {};

        iterateOverLines({ 
          firstSelectedLine: firstSelected[1],
          lastSelectedLine: currentContent.length-1,
          firstSelectedSpan: firstSelected[2],
          lastSelectedSpan: currentContent[currentContent.length-1].styles.length-1,
          p
        })
        continue;
      }

      // middle paragraph
      if (p > firstSelected[0] && p < lastSelected[0]) {
        if (!currentContent[currentContent.length-1].styles) return {};
        if (!Object.keys(uniqueStyles).length) return {};

        iterateOverLines({ 
          firstSelectedLine: 0,
          lastSelectedLine: currentContent.length-1,
          firstSelectedSpan: 0,
          lastSelectedSpan: currentContent[currentContent.length-1].styles.length-1,
          p
        })
        continue;
      }

      // last paragraph
      if (p > firstSelected[0] && p === lastSelected[0]) {
        if (!Object.keys(uniqueStyles).length) return {};
        
        iterateOverLines({ 
          firstSelectedLine: 0,
          lastSelectedLine: lastSelected[1],
          firstSelectedSpan: 0,
          lastSelectedSpan: lastSelected[2],
          p
        })
      }
    }

    return uniqueStyles;
  }
}
export default getContinuousStyles;
