import Home from 'pages/home';
import Auth from 'pages/auth';
import Editor from 'pages/editor';
import EditorMainMenu from 'pages/editorMainMenu';
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
    path: '/editor',
    exact: true,
    component: EditorMainMenu
  },
  {
    path: '/editor/draft/:id',
    exact: true,
    component: Editor,
  },
  {
    path: '/editor/post/:id',
    exact: true,
    component: Editor,
  },
  {
    path: '/post/:id',
    exact: true,
    component: Editor,
  },
  {
    path: '/account',
    exact: true,
    component: AccountSettings
  },
  
]

export default routes;
