import Home from 'pages/home';
import Auth from 'pages/auth';
import File from 'pages/file';
import Editor from 'pages/editor';

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
  {
    path: '/editor',
    exact: true,
    component: Editor
  },
  
]

export default routes;
