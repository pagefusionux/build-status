import { h, render } from 'preact';
import App from '../components/App';

it('renders without crashing', () => {
  const div = document.createElement('div');
  render(<App />, div);
});
