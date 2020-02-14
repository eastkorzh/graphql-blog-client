import { createTheme, darkThemePrimitives, DarkTheme } from 'baseui';

const primitives = {
  ...darkThemePrimitives,
  primaryFontFamily: 'JetBrains',
};

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
