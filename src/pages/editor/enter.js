
import { br, zws } from './constants';

const enter = ({ articleState, selection, nodeAddress }) => {
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

  const result = [];

  for (let paragraphIndex=0; paragraphIndex<articleState.article.length; paragraphIndex++) {
    const paragraph = articleState.article[paragraphIndex];

    if (paragraphIndex !== nodeAddress[0]) {
      result.push(paragraph)
    } else {
      const firstPartContent = [];
      const lastPartContent = [];

      for (let contentIndex=0; contentIndex<paragraph.content.length; contentIndex++) {
        if (contentIndex !== nodeAddress[1]) {
          if (contentIndex <= nodeAddress[1]) {
            // prevent <br /> insertion at the paragraph ending
            if (selection === 0 && nodeAddress[1]-1 === contentIndex && paragraph.content[contentIndex] === br) continue;
            firstPartContent.push(paragraph.content[contentIndex])
          } else {
            lastPartContent.push(paragraph.content[contentIndex])
          }
        } else {
          if (!(selection === 0 && nodeAddress[1] > 0)) {
            firstPartContent.push({
              text: firstPartText,
              styles: firstPartStyles,
            });
          }

          lastPartContent.push({
            text: lastPartText,
            styles: lastPartStyles,
          });
        }
      }
      
      result.push({
        type: 'text',
        content: firstPartContent,
      });       
      
      result.push({
        type: 'text',
        content: lastPartContent,
      });
    }
  }
  
  return {
    newState: result,
    newCaretPosition: {
      offset: 0,
      selection: 0,
      nodeAddress: [nodeAddress[0]+1, 0, 0]
    }
  }
}

export default enter;
