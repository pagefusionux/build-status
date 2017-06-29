import { h, Component } from 'preact';
import '../scss/ProgressBar.css';

class ProgressBar extends Component {
  /*
  constructor(props) {
    super(props);
  }
  */
  render() {
    return (
      <div className="progress-bar">
        <div className="percentage" style={this.props.percentageStyle}>{this.props.percentageText}</div>
        <div className={this.props.barClassName} style={this.props.barStyle}></div>
      </div>
    );
  }
}

export default ProgressBar;
