if (anchorOffset !== 0 && anchorNode.data !== '\u{200B}') {
  document.execCommand("delete");
} else {
  let index = null;
  let nodeWithDataset = anchorNode;

  while (true) {
    let i = 0;
    if (nodeWithDataset.dataset && nodeWithDataset.dataset.index) {
      index = parseInt(nodeWithDataset.dataset.index);
      break;
    } else {
      if (i < 20) i++ 
      else break;
      nodeWithDataset = nodeWithDataset.parentNode;
    }
  }

  if (nodeWithDataset.previousSibling) {
    const newState = [];
    const firstPart = articleText[index-1].content;
    const lastPart = articleText[index].content;
    let result = '';
    console.log(firstPart, lastPart)
    if (firstPart.join('') === '\u{200B}' && lastPart.join('') === '\u{200B}') {
      result = ['\u{200B}'];
    } else if (lastPart.join('') === '\u{200B}') {
      result = firstPart;
    } else if (firstPart.join('') === '\u{200B}') {
      result = lastPart;
    } else {
      result = firstPart.concat(lastPart);
    }

    for (let i = 0; i < articleText.length; i++) {
      if (i !== index-1) {
        if (i === index) continue;
        newState.push(articleText[i])
      } else {
        newState.push({
          tag: 'p',
          content: result,
        })
      }
    }
    setArticleText(newState)
    setSelectedNode({ 
      type: 'DELETE_LINE',
      node: nodeWithDataset.previousSibling, 
      offset: firstPart.join('') === '\u{200B}' ? 0 : firstPart.join('').length, 
    })
  }
}