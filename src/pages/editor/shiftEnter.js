import { br, zws } from './constants';

// Shift + Enter
const shiftEnter = ({ articleState, selection, nodeAddress }) => {
  const nodeCopy = articleState.article[nodeAddress[0]].content[nodeAddress[1]];
  const firstPartText = nodeCopy.text.slice(0, selection) || zws;
  const lastPartText = nodeCopy.text.slice(selection) || zws;

  let firstPartStyles = [];
  let lastPartStyles = [];

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
        lastPartStyles.push({
          ...item,
          range: [item.range[0] - selection, item.range[1] - selection]
        })
        continue;
      }
    }
  }

  if (!firstPartStyles.length) firstPartStyles = null;
  if (!lastPartStyles.length) lastPartStyles = null;

  let result = [];

  for (let paragraphIndex=0; paragraphIndex<articleState.article.length; paragraphIndex++) {
    const paragraph = articleState.article[paragraphIndex];

    if (paragraphIndex !== nodeAddress[0]) {
      result.push(paragraph)
    } else {
      const newContent = [];
      for (let contentIndex=0; contentIndex<paragraph.content.length; contentIndex++) {
        if (contentIndex !== nodeAddress[1]) {
          newContent.push(paragraph.content[contentIndex])
        } else {
          newContent.push({
            text: firstPartText,
            styles: firstPartStyles,
          });
          newContent.push(br);
          newContent.push({
            text: lastPartText,
            styles: lastPartStyles,
          });
        }
      }
      
      result.push({
        id: paragraph.id,
        type: 'text',
        content: newContent,
      })
    }
  }

  return {
    newState: result,
    newCaretPosition: {
      offset: 0,
      selection: 0,
      nodeAddress: [nodeAddress[0], nodeAddress[1]+2, 0]
    }
  }
}

export default shiftEnter;
