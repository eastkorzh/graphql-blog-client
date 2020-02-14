if (e.keyCode === 13) {
  e.preventDefault();
  
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

  const newState = [];
  let firstContent = [];
  let lastContent = [];
  let i = 0;
  for (let item of articleText[index].content) {
    if (anchorOffset === 0) {
      if (anchorNode.data !==  nodeWithDataset.childNodes[0].textContent) {
        if (item === anchorNode.data) {
          lastContent.push(item);
          continue;
        };
      } else {
        firstContent.push('\u{200B}');
        lastContent = articleText[index].content;
        break;
      }
    }

    if (lastContent.length !== 0) {
      lastContent.push(item);
      continue;
    }

    if (item === anchorNode.data || item === anchorNode.textContent) {
      firstContent.push(item.slice(0, anchorOffset) || '\u{200B}');
      lastContent.push(item.slice(anchorOffset) || '\u{200B}');
    } else {
      firstContent.push(item);
    }
    i++;
  }

  for (let i = 0; i < articleText.length; i++) {
    if (i !== index) {
      newState.push(articleText[i])
    } else {
      newState.push({
        tag: 'p',
        content: firstContent,
      })
      newState.push({
        tag: 'p',
        content: lastContent,
      })
    }
  }
  
  setSelectedNode({ node: nodeWithDataset, offset: anchorOffset, type: 'NEW_LINE' })
  setArticleText(newState);

  return;
}