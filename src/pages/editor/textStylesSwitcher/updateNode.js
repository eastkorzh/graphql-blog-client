const updateNode = ({ nodeCopy, aL, aR, ejectingStyles }) => {
  if (!nodeCopy.styles) {
    nodeCopy.styles = [{
      style: {
        fontWeight: '',
      },
      range: [0, nodeCopy.text.length],
    }];
  }

  const newStyles = [];

  for (let i=0; i<nodeCopy.styles.length; i++) {
    const currentStyle = nodeCopy.styles[i];

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

    // a - selected range, b - current style range
    //               aL __________________ aR
    //       bL ________ bR bL ___ bR bL ______ bR

    if ((aL <= bL && bR < aR) || (aL < bL && bR <= aR)) {
      newStyles.push({
        ...currentStyle,
        style: {
          ...currentStyle.style,
          ...ejectingStyles
        },
        range: [bL, bR]
      })
    }
  }

  nodeCopy.styles = newStyles;

  return nodeCopy;
}

export default updateNode;
