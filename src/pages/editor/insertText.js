import { zws } from './constants';

const insertText = ({ articleState, selection, nodeAddress, offset, text }) => {
  const stateCopy = {...articleState};
  const nodeCopy = stateCopy.article[nodeAddress[0]].content[nodeAddress[1]];

  const firstText = nodeCopy.text.slice(0, selection);
  const lastText = nodeCopy.text.slice(selection);

  let newStyles = [];

  if (nodeCopy.styles) {
    for (let i=0; i<nodeCopy.styles.length; i++) {
      const style = nodeCopy.styles[i]

      if (style.range[1] < selection) {
        newStyles.push(style);
        continue;
      }

      if (style.range[0] < selection && style.range[1] >= selection) {
        newStyles.push({
          ...style,
          range: [style.range[0], style.range[1] + text.length]
        })
        continue;
      }

      if (style.range[0] === 0) {
        newStyles.push({
          ...style,
          range: [0, style.range[1] + text.length]
        })
        continue;
      }

      if (style.range[0] >= selection) {
        newStyles.push({
          ...style,
          range: [style.range[0] + text.length, style.range[1] + text.length],
        })
        continue;
      }
    }
  } else {
    newStyles = null;
  }

  nodeCopy.text = firstText + text + lastText;
  nodeCopy.styles = newStyles;

  if (offset === 0 && nodeAddress[2] !== 0) {
    const newNodeAddress = [nodeAddress[0], nodeAddress[1], nodeAddress[2]-1];
    let newOffset = null;

    for (let style of newStyles) {
      const range = style.range;
      if (range[1] === selection + text.length) newOffset = range[1] - range[0]
    }
  
    return ({
      newState: stateCopy.article,
      newCaretPosition: {
        offset: newOffset,
        selection: selection + text.length,
        nodeAddress: newNodeAddress,
      }
    })
  } else {
    return ({
      newState: stateCopy.article,
      newCaretPosition: {
        offset: offset + text.length,
        selection: selection + text.length,
        nodeAddress,
      }
    })
  }
}

export default insertText;
