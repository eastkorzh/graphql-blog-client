import { zws } from './constants';

const deleteSelected = ({ articleState, selectedRange, offset }) => {
  if (selectedRange[0].length === 3) return null;
  
  const firstContent = [...articleState.article[selectedRange[0][0]].content];
  const lastContent = [...articleState.article[selectedRange[1][0]].content];

  const firstContentNode = firstContent[selectedRange[0][1]];
  const lastContentNode = lastContent[selectedRange[1][1]];

  const firstText = firstContentNode.text.slice(0, selectedRange[0][3]);
  const lastText = lastContentNode.text.slice(selectedRange[1][3]);

  let firstStyles = [];
  let lastStyles = [];
  
  if (firstContentNode.styles) {
    const selection = selectedRange[0][3];
    for (let item of firstContentNode.styles) {
      if (item.range[1] <= selection) {
        firstStyles.push(item);
        continue;
      }

      if (item.range[0] < selection  && item.range[1] > selection) {
        firstStyles.push({
          ...item,
          range: [item.range[0], selection]
        });
        continue;
      }
    }
  } else {
    firstStyles.push({
      style: {
        fontWeight: "",
        fontStyle: "",
      },
      range: [0, firstText.length]
    })
  }

  if (lastContentNode.styles) {
    const selection = selectedRange[1][3];
    for (let item of lastContentNode.styles) {
      if (item.range[0] < selection && item.range[1] > selection) {
        lastStyles.push({
          ...item,
          range: [firstText.length, item.range[1] - selection + firstText.length]
        })
        continue;
      }

      if (item.range[0] >= selection) {
        lastStyles.push({
          ...item,
          range: [item.range[0] - selection + firstText.length, item.range[1] - selection + firstText.length]
        })
        continue;
      }
    }
  } else if (lastText.length) {
    lastStyles.push({
      style: {
        fontWeight: "",
        fontStyle: "",
      },
      range: [firstText.length, firstText.length + lastText.length]
    })
  }

  const result = [];
  const newContent = [];

  for (let i=0; i<articleState.article.length; i++) {
    if (i < selectedRange[0][0]) result.push(articleState.article[i]);
    
    if (i === selectedRange[0][0]) {
      for (let j=0; j<=selectedRange[0][1]; j++) {
        if (j !== selectedRange[0][1]) {
          newContent.push(firstContent[j])
        } else {
          if (!(firstText+lastText)) {
            newContent.push({
              text: zws,
              styles: null,
            })
          } else {
            newContent.push({
              text: firstText+lastText,
              styles: (firstStyles.length || lastStyles.length) ? [...firstStyles, ...lastStyles] : null
            })
          }
        }
      }
    }
    if (i === selectedRange[1][0]) {
      for (let j=selectedRange[1][1]+1; j<lastContent.length; j++) {
        newContent.push(lastContent[j])
      }
      result.push({
        id: articleState.article[i].id,
        type: 'text',
        content: newContent
      })
    }
  }

  for (let i=selectedRange[1][0]+1; i<articleState.article.length; i++) {
    result.push(articleState.article[i])
  }

  return {
    newState: result,
    newCaretPosition: {
      offset: offset,
      selection: selectedRange[0][3],
      nodeAddress: selectedRange[0].slice(0, 3)
    }
  }
}

export default deleteSelected;
