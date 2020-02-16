const br = 'U+23CE';

const initialState = [
  { 
    type: 'text',
    content: [
      {
        text: "1. Never gonna give you up",
        styles: [
          {
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [0, 5]
          }, {
            style: {
              fontWeight: 'bold',
              fontStyle: 'italic',
            },
            range: [5, 12]
          }, {
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [12, 26]
          }
        ]
      },
      br,
      {
        text: "2. Never gonna let you down",
      },
    ],
  },
  { 
    type: 'text',
    content: [
      {
        text: "3. Never gonna run around and desert you",
        styles: [
          {
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [0, 5]
          }, {
            style: {
              fontWeight: 'bold',
              fontStyle: 'italic',
            },
            range: [5, 12]
          }, {
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [12, 40]
          }
        ]
      },
      br,
      {
        text: "4. Never gonna make you cry",
      },
      br,
      {
        text: "4. Never gonna make you cry",
      },
      br,
      {
        text: "4. Never gonna make you cry",
      },
    ],
  },
  { 
    type: 'text',
    content: [
      {
        text: "5. Never gonna run around and desert you",
        styles: [
          {
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [0, 5]
          }, {
            style: {
              fontWeight: 'bold',
              fontStyle: 'italic',
            },
            range: [5, 12]
          }, {
            style: {
              fontWeight: "",
              fontStyle: "",
            },
            range: [12, 40]
          }
        ]
      },
      br,
      {
        text: "6. Never gonna make you cry",
      },
    ],
  },
]

export default initialState;
