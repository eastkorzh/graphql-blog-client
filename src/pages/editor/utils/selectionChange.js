const getNodeWithDataset = (anchorNode, dataset = 'index') => {
  if (anchorNode === null) return null;
  let index = null;
  let nodeWithDataset = anchorNode;
  
  while (true) {
    let i = 0;
    if (nodeWithDataset.dataset && nodeWithDataset.dataset[dataset]) {
      index = parseInt(nodeWithDataset.dataset[dataset]);
      break;
    } else {
      if (i < 20) i++ 
      else break;
      nodeWithDataset = nodeWithDataset.parentNode;
    }
  }

  return { index, nodeWithDataset }
}

const selectionChange = () => {
  let { anchorNode, anchorOffset, focusNode, focusOffset, isCollapsed } = document.getSelection();

  // prevent bug when double click on text node makes focusNode return whole paragraph
  if (focusNode && !focusNode.data && anchorNode.data) {
    const { nodeWithDataset: anchorWithRootDataset } = getNodeWithDataset(anchorNode);
    
    focusNode = anchorWithRootDataset.lastChild.lastChild;
    focusOffset = anchorWithRootDataset.lastChild.lastChild.data.length;
  }

  if (anchorNode === null || !anchorNode.data || focusNode === null || !focusNode.data) return;

  
  if (anchorNode.parentNode.localName === 'h1') {
    return {
      offset: anchorOffset < focusOffset ? anchorOffset : focusOffset,
      selection: anchorOffset < focusOffset ? anchorOffset : focusOffset,
      nodeAddress: null,
      selectedRange: [anchorOffset, focusOffset].sort((a, b) => a - b),
    }
  }
  
  if (anchorNode.parentNode.localName !== 'span') return;
  
  const { nodeWithDataset: anchorWithRootDataset } = getNodeWithDataset(anchorNode);
  const { nodeWithDataset: focusWithRootDataset } = getNodeWithDataset(focusNode);
  const { nodeWithDataset: anchorWithDataset } = getNodeWithDataset(anchorNode, 'spanindex');
  const { nodeWithDataset: focusWithDataset } = getNodeWithDataset(focusNode, 'spanindex');

  const anchorText = anchorNode.data;
  const focusText = focusNode.data;

  const anchorDataset = anchorWithDataset.dataset.spanindex.split(',').map(a => parseInt(a));
  const focusDataset = focusWithDataset.dataset.spanindex.split(',').map(a => parseInt(a));

  const selectedRange = [
    anchorDataset,
    focusDataset,
  ];

  let selection = null;

  const getFullOffset = (rootNode, text, offset) => {
    let result = 0;

    for (let node of rootNode.childNodes) {
      if (node.textContent !== text) {
        result += node.textContent.length;
      } else {
        result += offset;
        break;
      }
    }

    return result;
  }

  if (isCollapsed) {
    selection = getFullOffset(anchorWithRootDataset, anchorText, anchorOffset);
  } else {
    if (selectedRange[0][0] === selectedRange[1][0] && selectedRange[0][1] === selectedRange[1][1]) {
      selectedRange[0].push(getFullOffset(anchorWithRootDataset, anchorText, anchorOffset));
      selectedRange[1].push(getFullOffset(anchorWithRootDataset, focusText, focusOffset));
    } else {
      selectedRange[0].push(getFullOffset(anchorWithRootDataset, anchorText, anchorOffset));
      selectedRange[1].push(getFullOffset(focusWithRootDataset, focusText, focusOffset));
    }
  }

  const selectedRangeCopy = [...selectedRange]

  if (selectedRange[0][1] === selectedRange[1][1] && selectedRange[0][0] === selectedRange[1][0]) {
    selectedRange.sort((a, b) => a[3] - b[3])
  } else {
    selectedRange.sort((a, b) => a[1] - b[1]).sort((a, b) => a[0] - b[0]);
  }
  
  return {
    offset: anchorOffset < focusOffset ? anchorOffset : focusOffset,
    selection,
    nodeAddress: selectedRange[0].slice(0, 3),
    selectedRange: selectedRange,
    fromLeftToRight: selectedRangeCopy[0][3] < selectedRangeCopy[1][3],
  }
}

export default selectionChange;
