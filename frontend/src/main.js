import './styles/global.css';
import App from './App.svelte';
import { checkAuth } from './stores/auth';

const app = new App({
  target: document.getElementById('app'),
});

checkAuth();

export default app;
