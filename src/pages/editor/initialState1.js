const br = 'U+23CE';

const initialState = {
  caretPosition: null,
  h1: 'Header',
  article: [
    { 
      id: 'fkajs',
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
      id: 'qqq',
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
      ],
    },
    {
      id: 'aklsd',
      type: 'img',
      src: 'https://res.cloudinary.com/eastkorzh/image/upload/v1583084511/sample.jpg',
    },
    { 
      id: 'kasfv',
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
      ],
    },
  ]
}

export default initialState;
