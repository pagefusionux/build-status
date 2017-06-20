import { h, Component } from 'preact';
import BuildStatus from './BuildStatus';
import '../css/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="header-container">
          <h2>Build Status</h2>
        </div>

        <BuildStatus/>
      </div>
    );
  }
}

export default App;
