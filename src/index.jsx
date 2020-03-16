import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider } from 'baseui';
import { ApolloProvider } from '@apollo/react-hooks';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from 'apollo-link-context';

import routes from './routes';
import history from "./history";
import 'styles/index.css';
import theme from 'styles/theme';

const aploadLink = createUploadLink({ uri: `${process.env.REACT_APP_URI}` });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(aploadLink),
  cache: new InMemoryCache(),
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
