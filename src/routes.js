import Home from 'pages/home';
import Auth from 'pages/auth';
import File from 'pages/file';

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
  {
    path: '/file',
    exact: true,
    component: File
  },
  
]

export default routes;
