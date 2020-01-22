import { createTheme, darkThemePrimitives, lightThemePrimitives, DarkTheme } from 'baseui';

const primitives = {
  ...darkThemePrimitives,
  primaryFontFamily: 'JetBrains',
};
console.log(DarkTheme)
const overrides = {
  colors: {
    ...DarkTheme.colors,
  },
  borders: {
    buttonBorderRadius: '5px',
    inputBorderRadius: '5px',
  }
}


const theme = createTheme(primitives, overrides);

export default theme;
