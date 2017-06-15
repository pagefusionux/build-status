import { h, Component } from 'preact';
import loadingImg from '../images/loading.svg';
import '../css/BuildStatus.css';

class BuildStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: 1,
      error: undefined,
      number: undefined,
      result: undefined,
      timestamp: undefined,
      estimatedDuration: undefined,
      duration: undefined
    }
  }

  getBuildStatus = () => {
    const main = this;

    fetch('http://localhost.jenkinsapi')
    .then((response) => {
      return response;
    })
    .then((response) => {
      setTimeout(() => {
        main.setState({
          loading: 0
        });
      }, 300);
      return response.json();
    })
    .then((data) => {

      console.log(data);

      main.setState({
        error: null,
        number: data.number,
        result: data.result,
        timestamp: data.timestamp,
        estimatedDuration: data.estimatedDuration,
        duration: data.duration,
      });
    })
    .catch(() => {
      main.setState({
        error: 'error'
      });
    })
  };
  componentDidMount() {
    this.getBuildStatus();
  };
  render() {

    const {
      error,
      loading,
      number,
      result,
      timestamp,
      estimatedDuration,
      duration
    } = this.state;

    let resultOutput = '';
    let percentage = 0;

    if (loading) {
      resultOutput = (
        <p><img className="loadingImg" src={loadingImg} alt="Loading..." /></p>
      );
    } else {

      percentage = Math.round((new Date().getTime() - timestamp) / estimatedDuration * 100);
      if (percentage > 100) {
        percentage = 100;
      }

      if (error) {
        resultOutput = (
          <p>Error: {error}</p>
        );
      } else {
        resultOutput = (
          <div>
            <ul>
              <li>Build Number: {number}</li>
              <li>Result: {result}</li>
              <li>Timestamp: {timestamp}</li>
              <li>estimatedDuration: {estimatedDuration}</li>
              <li>duration: {duration}</li>
              <li>percentage: {percentage}%</li>
            </ul>
          </div>
        );
      }
    }

    return (
      <div className="BuildStatus">
        {resultOutput}
      </div>
    );
  }
}

export default BuildStatus;
