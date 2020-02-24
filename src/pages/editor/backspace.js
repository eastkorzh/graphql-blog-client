import { br, zws } from './constants';
import deleteSelected from './deleteSelected';

const backspace = ({
  articleState, 
  offset, 
  selection, 
  nodeAddress, 
  articleRef, 
  e,
}) => {
  const caretNode = articleRef.current
  .childNodes[nodeAddress[0]]
  .childNodes[nodeAddress[1]]
  .childNodes[nodeAddress[2]]

  // caret at begining
  if (offset === 0) {
    e.preventDefault();

    const stateCopy = [...articleState.article];

    // callapse paragraph with zws paragraph
    if (nodeAddress[0] !== 0 && nodeAddress[1] === 0 && stateCopy[nodeAddress[0]-1].content[0].text === zws) {
      const result = [];
      const newNodeAddress = [nodeAddress[0]-1, 0, 0];

      for (let paragraphIndex=0; paragraphIndex<stateCopy.length; paragraphIndex++) {
        if (paragraphIndex !== nodeAddress[0]-1) result.push(stateCopy[paragraphIndex])
      }

      return {
        newState: result,
        newCaretPosition: {
          offset: 0,
          selection: 0,
          nodeAddress: newNodeAddress,
        }
      }
    }

    // collapse two paragraphs
    if (nodeAddress[1] === 0 && nodeAddress[0] !== 0) {
      const paragraphCopy = stateCopy[nodeAddress[0]]
      const prevParagraphCopy = stateCopy[nodeAddress[0]-1]
      const newNodeAddress = [nodeAddress[0]-1, prevParagraphCopy.content.length+1, 0]
      const result = [];
      
      prevParagraphCopy.content.push(br);
      prevParagraphCopy.content = prevParagraphCopy.content.concat(paragraphCopy.content);

      for (let paragraphIndex=0; paragraphIndex<stateCopy.length; paragraphIndex++) {
        if (paragraphIndex === nodeAddress[0]) continue;
        if (paragraphIndex === nodeAddress[0]-1) {
          result.push(prevParagraphCopy);
        } else {
          result.push(stateCopy[paragraphIndex]);
        }
      }

      return {
        newState: result,
        newCaretPosition: {
          offset: 0,
          selection: 0,
          nodeAddress: newNodeAddress,
        }
      }
    } 

    // collapse two lines
    if(nodeAddress[1] !== 0) {
      const content = [...stateCopy[nodeAddress[0]].content];
      const prevLineLength = content[nodeAddress[1]-2].text.length;

      let newText = null;
      let newStyles = [];
      const resultContent = [];

      if (content[nodeAddress[1]].text === zws) {
        newText = content[nodeAddress[1]-2].text;
      } else {
        newText = content[nodeAddress[1]-2].text + content[nodeAddress[1]].text;
      }

      if (content[nodeAddress[1]-2].styles) {
        newStyles = [...content[nodeAddress[1]-2].styles];
      } else {
        newStyles = [{
          style: {
            fontWeight: '',
            fontStyle: '',
          },
          range: [0, prevLineLength]
        }]
      }
      if (content[nodeAddress[1]].text !== zws) {
        if (content[nodeAddress[1]].styles) {
          for (let item of content[nodeAddress[1]].styles) {
            const newItem = {
              ...item,
              range: [item.range[0]+prevLineLength, item.range[1]+prevLineLength]
            }
            newStyles.push(newItem)
          }
        } else {
          newStyles.push({
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [prevLineLength, prevLineLength + content[nodeAddress[1]].text.length]
          })
        }
      }
      
      for (let i=0; i<content.length; i++) {
        if (i === nodeAddress[1]-1 || i === nodeAddress[1]) continue;
        if (i !== nodeAddress[1]-2) {
          resultContent.push(content[i])
        } else {
          resultContent.push({
            text: newText,
            styles: newStyles,
          })
        }
      }

      const prevStyles = content[nodeAddress[1]-2].styles && [...content[nodeAddress[1]-2].styles];
      let newNodeAddress = [nodeAddress[0], nodeAddress[1]-2, null];
      let newOffset = null;

      if (prevStyles) {
        newOffset = prevStyles[prevStyles.length-1].range[1] - prevStyles[prevStyles.length-1].range[0];
        newNodeAddress[2] = prevStyles.length - 1;
      } else {
        newOffset = prevLineLength;
        newNodeAddress[2] = 0;
      }

      stateCopy[nodeAddress[0]].content = resultContent;

      return {
        newState: stateCopy,
        newCaretPosition: {
          offset: newOffset,
          selection: prevLineLength,
          nodeAddress: newNodeAddress,
        }
      }
    }
  }
  
  // caret in text in front of span
  if (offset === 1 && caretNode.textContent.length === 1) {
    e.preventDefault();
    const stateCopy = [...articleState.article];
    const nodeCopy = stateCopy[nodeAddress[0]].content[nodeAddress[1]];

    if (nodeCopy.text.length === 1) {
      nodeCopy.text = zws;
      nodeCopy.styles = null;
      stateCopy[nodeAddress[0]].content[nodeAddress[1]] = nodeCopy;

      return {
        newState: stateCopy,
        newCaretPosition: {
          offset: 0,
          selection: 0,
          nodeAddress,
        }
      }
    } else {
      nodeCopy.text = nodeCopy.text.slice(0, selection-1)+nodeCopy.text.slice(selection);
    }

    if (nodeCopy.styles !== null) {
      const result = [];

      for (let i=0; i<nodeCopy.styles.length; i++) {
        const currentStyle = nodeCopy.styles[i];

        if (i === nodeAddress[2]) continue;
        if (i < nodeAddress[2]) {
          result.push(currentStyle)
        }
        if (i > nodeAddress[2]) {
          result.push({
            ...currentStyle,
            range: [currentStyle.range[0]-1, currentStyle.range[1]-1]
          })
        }
      }
      nodeCopy.styles = result;
    }
    
    stateCopy[nodeAddress[0]].content[nodeAddress[1]] = nodeCopy;

    if (nodeAddress[2] > 0) {
      return {
        newState: stateCopy,
        newCaretPosition: {
          offset: articleRef.current
          .childNodes[nodeAddress[0]]
          .childNodes[nodeAddress[1]]
          .childNodes[nodeAddress[2] - 1].lastChild.length,
          selection: selection - 1,
          nodeAddress: [nodeAddress[0], nodeAddress[1], nodeAddress[2] - 1]
        }
      }
    } else {
      return {
        newState: stateCopy,
        newCaretPosition: {
          offset: 0,
          selection: 0,
          nodeAddress: [nodeAddress[0], nodeAddress[1], 0]
        }
      }
    }
  }
}

export default backspace;
