const concatSameStyles = (node) => {
  console.log(node);
}


// for (let i=selectedRange[0][0]; i<=selectedRange[1][0]; i++) {
//   if (stateCopy.article[i].type !== 'text') continue;
  
//   const content = stateCopy.article[i].content;

//   if (i === selectedRange[0][0]) {
//     // selection only inside the paragraph
//     if (selectedRange[0][0] === selectedRange[1][0]) {
//       for (let j=selectedRange[0][1]; j<=selectedRange[1][1]; j++) {
//         if (content[j] !== br) {
//           console.log('1',content[j])
//           continue;
//         }
//       }
//     } else {
//       // selection not only inside the paragraph
//       for (let j=selectedRange[0][1]; j<content.length; j++) {
//         if (content[j] !== br) {
//           console.log('2',content[j])
//           continue;
//         }
//       }
//     }
//   }

//   // selection overlap the paragraph with both sides
//   if (i < selectedRange[1][0]) {
//     for (let j=0; j<content.length; j++) {
//       if (content[j] !== br) {
//         console.log('3',content[j])
//         continue;
//       }
//     }
//   }

//   // selection selection overlap top of paragraph
//   if (i === selectedRange[1][0]) {
//     for (let j=0; j<= selectedRange[1][1]; j++) {
//       if (content[j] !== br) {
//         console.log('4', content[j])
//         continue;
//       }
//     }
//   }
// }

export default concatSameStyles;
