import { h, render } from 'preact';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import './css/index.css';

render(<App />, document.getElementById('root'));
registerServiceWorker();
