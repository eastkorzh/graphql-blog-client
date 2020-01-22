import Home from 'pages/home';
import Auth from 'pages/auth';

const routes = [
  {
    path: '/',
    exact: true,
    component: Home
  },
  {
    path: '/auth',
    exact: true,
    component: Auth
  },
]

export default routes;
