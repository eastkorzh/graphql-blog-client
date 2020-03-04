import Home from 'pages/home';
import Auth from 'pages/auth';
import File from 'pages/file';
import Editor from 'pages/editor';
import AccountSettings from './pages/accountSettings';

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
  {
    path: '/account',
    exact: true,
    component: AccountSettings
  },
  
]

export default routes;
