import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider, DarkTheme } from 'baseui';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';

import routes from './routes';
import history from "./history";
import 'styles/index.css';
import theme from 'styles/theme';

const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  request: (operation) => {
    const token = localStorage.getItem('token');
    operation.setContext({
      headers: {
        authorization: token || ''
      }
    })
  },
});

const engine = new Styletron();

ReactDOM.render(
  <StyletronProvider value={engine}>
    <BaseProvider theme={theme}>
      <ApolloProvider client={client}>
        <Router history={history}>
          <Switch>
            {routes.map((route, ind) => 
              <Route 
                key={ind}
                path={route.path}
                exact={route.exact}
                component={route.component}
              />
            )}
          </Switch>
        </Router>
      </ApolloProvider>
    </BaseProvider>
  </StyletronProvider>,
  document.getElementById('root')
);
