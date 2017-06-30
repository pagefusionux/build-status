import { h, render } from 'preact';
import App from './components/App';
//import registerServiceWorker from './registerServiceWorker';
import './scss/index.css';

render(<App />, document.getElementById('root'));
//registerServiceWorker(); // comment out as we're deployed on an insecure domain
