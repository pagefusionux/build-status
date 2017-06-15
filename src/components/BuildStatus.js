import { h, Component } from 'preact';
import loadingImg from '../images/loading.svg';
import moment from 'moment';
import '../css/BuildStatus.css';

class BuildStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: 1,
      secondsElapsed: 0,
      error: '',
      number: 0,
      result: undefined,
      timestamp: undefined,
      estimatedDuration: 0,
      duration: 0
    }
  }

  getBuildStatus = () => {
    const main = this;

    const reqHost = window.location.host;

    fetch(`http://localhost.jenkinsapi?req_host=${reqHost}`)
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

      //console.log(data);

      main.setState({
        secondsElapsed: this.state.secondsElapsed + 1,
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
    //this.getBuildStatus();
  };
  render() {

    const {
      error,
      loading,
      secondsElapsed,
      number,
      result,
      timestamp,
      estimatedDuration,
      duration
    } = this.state;

    let resultOutput = '';
    let percentage = 0;
    let durationText = '';
    let resultText = '';

    // convert timestamp
    const timestampConv = moment(timestamp).format('MMM D YYYY h:mm A');
    //let timestampEnd = 0;

    // convert to seconds/minutes
    const durationTempConv = moment.duration(duration);

    //console.log('durationTempConv: ', durationTempConv);

    const durationConv = durationTempConv.minutes() + 'm ' + durationTempConv.seconds() + 's';
    const estimatedDurationTempConv = moment.duration(estimatedDuration);
    const estimatedDurationConv = estimatedDurationTempConv.minutes() + 'm ' + estimatedDurationTempConv.seconds() + 's';

    if (loading) {
      resultOutput = (
        <p className="loading-container"><img className="loadingImg" src={loadingImg} alt="Loading..." /></p>
      );
    } else {

      percentage = Math.round((new Date().getTime() - timestamp) / estimatedDuration * 100);
      if (percentage > 100 || duration > 0) {
        percentage = 100;
      }

      if (error) {
        resultOutput = (
          <p>Error: {error}</p>
        );
      } else {

        // duration
        if (duration > 0) {
          durationText = `Duration: ${durationConv}`;
        } else {
          durationText = `Elapsed: ${secondsElapsed}, Estimated duration: ${estimatedDurationConv}`;
        }

        let barClassName = 'bar';
        let barTopRightRadius = 0;
        let barBottomRightRadius = 0;
        let percentageColor = '#000';

        //percentage = 35; // for testing

        if (percentage === 100 && result === 'SUCCESS') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-success';
          //barClassName = 'bar';
          resultText = 'COMPLETE';

          /*
          let tsStart = moment(timestamp);
          //console.log('tsStart: ', tsStart);

          const sDuration = duration / 1000;

          //console.log('sDuration: ', sDuration);

          timestampEnd = moment(tsStart, 'hh:mm:ss A')
            .add(durationTempConv.minutes(), 'minutes')
            .add(durationTempConv.seconds(), 'seconds')
            .format('LTS');

          //console.log('tsEnd: ', tsEnd);
          */
        } else {
          resultText = 'BUILDING';
        }

        let barStyle = {
          width: `${percentage}%`,
          zIndex: 1,
          borderTopRightRadius: `${barTopRightRadius}px`,
          borderBottomRightRadius: `${barBottomRightRadius}px`,
        };

        if (percentage >= 55) {
          percentageColor = '#fff';
        }

        let percentageStyle = {
          color: `${percentageColor}`,
        };



        resultOutput = (
          <div>
            <div className="host">
              {window.location.host}
            </div>

            <div className="vsep"></div>

            <div className="status-areas">
              <div className="status-left">
                <strong>Started:</strong> {timestampConv}<br />
                <strong>Status:</strong> {resultText}<br />
              </div>
              <div className="status-right">
                <div className="build-number">
                  #{number}
                </div>
              </div>
            </div>

            <div className="vsep"></div>

            <div className="duration">
              {durationText}
            </div>
            <div className="progress">
              <div className="percentage" style={percentageStyle}>{percentage}%</div>
              <div className={barClassName} style={barStyle}></div>
            </div>
          </div>
        );
      }
    }

    if (percentage < 100 && result !== 'SUCCESS') {
      setTimeout(() => {
          this.getBuildStatus();
          console.log('seconds: ', this.state.secondsElapsed);
        }, 1000
      );
    }

    return (
      <div className="BuildStatus">
        {resultOutput}
      </div>
    );
  }
}

export default BuildStatus;
