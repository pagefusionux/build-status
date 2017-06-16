import { h, Component } from 'preact';
import loadingImg from '../images/loading.svg';
import moment from 'moment';
import '../css/BuildStatus.css';

class BuildStatus extends Component {
  constructor(props) {
    super(props);

    this.apiUrl = 'http://localhost.jenkinsapi'; // location of the API that queries the Jenkins build server
    this.overrideReqHost = ''; // for testing (override window.location.host)
    this.overrideReqBranch = ''; // for testing (override the branch to grab info for)

    this.state = {
      loading: 1,
      error: '',
      number: 0,
      result: undefined,
      timestamp: undefined,
      estimatedDuration: 0,
      duration: 0
    }
  }

  // TODO: grab commit information for build requested
  /*
  getCommits = () => {

  };
  */

  getBuildStatus = () => {
    const main = this;
    let error = '';

    fetch(`${this.apiUrl}?req_host=${window.location.host}&override_host=${this.overrideReqHost}&override_branch=${this.overrideReqBranch}`)
    .then((response) => {
      return response;
    })
    .then((response) => {

      if (this.state.loading) {
        setTimeout(() => {
          main.setState({
            loading: 0
          });
        }, 300);
      }
      return response.json();
    })
    .then((data) => {

      console.log(data);

      // check for API response error messages
      if (({}.toString.call(data.messages) === '[object Object]')) {
        for (let p in data.messages) {
          if (data.messages.hasOwnProperty(p)) {
            console.log(data.messages);
          }
        }

        main.setState({
          error: 'API exception occurred. (See console log.)'
        });
        error = 1;
      }

      if (!error) {

        main.setState({
          error: null,
          number: data.number,
          result: data.result,
          timestamp: data.timestamp,
          estimatedDuration: data.estimatedDuration,
          duration: data.duration,
        });

        if (data.result !== 'SUCCESS' && data.result !== 'FAILURE' && data.result !== 'ABORTED') {
          setTimeout(() => { // update every 3 seconds
              this.getBuildStatus();
            }, 3000
          );
        } else { // check every 30 seconds for any update (or re-build)
          setTimeout(() => {
              this.getBuildStatus();
            }, 30000
          );
        }
      }

    })
    .catch(() => {
      main.setState({
        error: 'Fetch API failed (general failure).'
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
    let durationText = '';
    let resultText = '';
    let timeElapsedText = '';
    let endTimestamp = 0;
    let endTimestampConv = '';

    // convert timestamp to readable date
    const timestampConv = moment(timestamp).format('MMM D, YYYY; h:mm:ss A');

    // compare now() to timestamp; convert timeElapsed to minutes/seconds
    const timestampElapsed = new Date().getTime() - timestamp;

    // convert timestampElapsed to minutes/seconds
    const timeElapsedConv = moment.duration(timestampElapsed);
    let timeElapsed = '';
    if (timeElapsedConv.minutes() > 0) {
      timeElapsed = timeElapsedConv.minutes() + 'm ' + timeElapsedConv.seconds() + 's';
    } else {
      timeElapsed = timeElapsedConv.seconds() + 's';
    }

    //console.log('timeElapsed (since timestamp): ', timeElapsed);

    // convert duration to minutes/seconds
    const durationMin = moment.duration(duration).minutes();
    const durationSec = moment.duration(duration).seconds();
    const durationConv = durationMin + 'm ' + durationSec + 's';

    if (duration > 0) {
      endTimestamp = timestamp + ((durationMin * 60) + durationSec);
      endTimestampConv = moment(endTimestamp).add(durationMin, 'm').add(durationSec, 's').format('MMM D, YYYY; h:mm:ss A');
    }

    // convert estimatedDuration to minutes/seconds
    const estimatedDurationTempConv = moment.duration(estimatedDuration);
    const estimatedDurationConv = estimatedDurationTempConv.minutes() + 'm ' + estimatedDurationTempConv.seconds() + 's';


    if (loading) {
      resultOutput = (
        <p className="loading-container"><img className="loadingImg" src={loadingImg} alt="Loading..." /></p>
      );
    } else {

      // get percentage (using time started and estimated duration)
      percentage = Math.round((new Date().getTime() - timestamp) / estimatedDuration * 100);

      // limit percentage to 100
      if (percentage > 100 || duration > 0) {
        percentage = 100;
      }

      // display any error
      if (error) {
        resultOutput = (
          <p>Error: {error}</p>
        );
      } else {

        // duration
        if (duration > 0) {
          durationText = `Build time: ${durationConv}`;
        } else {
          durationText = `(estimate: ${estimatedDurationConv})`;
        }

        let percentageText = `${percentage}%`
        let barClassName = 'bar';
        let barTopRightRadius = 0;
        let barBottomRightRadius = 0;
        let percentageColor = '#000';
        let showTimeElapsed = true;

        //percentage = 35; // for testing

        if (percentage === 100 && result === 'SUCCESS') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-success';
          resultText = 'COMPLETE';
          showTimeElapsed = false;

        } else if (percentage > 80 && result !== 'SUCCESS' && result !== 'FAILURE' && result !== 'ABORTED') {
          resultText = 'DEPLOYING';

        } else if (percentage === 100 && result !== 'SUCCESS' && result !== 'FAILURE' && result !== 'ABORTED') { // estimatedDuration passed
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          resultText = 'STILL DEPLOYING...';
          percentageText = 'Please wait...';

        } else if (result === 'FAILURE') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-failure';
          resultText = 'BUILD FAILED';
          percentageText = resultText;
          showTimeElapsed = false;

        } else if (result === 'ABORTED') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-aborted';
          resultText = 'ABORTED';
          percentageText = resultText;
          showTimeElapsed = false;

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

        // place a wbr tag in hostname so it can wrap decently
        let reqHostStr = window.location.host;
        reqHostStr = reqHostStr.replace('.clearlink', '<wbr/>.clearlink');

        function outputHTMLStr(str) { return {__html: str}; };

        let endTimestampText = '';

        if (showTimeElapsed === true) {
          timeElapsedText = `Time elapsed: ${timeElapsed}, `;
        } else {
          endTimestampText = `<strong>Ended:</strong> ${endTimestampConv}<br />`;
        }

        resultOutput = (
          <div>
            <div className="host">
              <div dangerouslySetInnerHTML={outputHTMLStr(reqHostStr)} />
            </div>

            <div className="vsep"></div>

            <div className="status-areas">
              <div className="status-left">
                <strong>Started:</strong> {timestampConv}<br />
                <div dangerouslySetInnerHTML={outputHTMLStr(endTimestampText)} />
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
              {timeElapsedText} {durationText}
            </div>
            <div className="progress">
              <div className="percentage" style={percentageStyle}>{percentageText}</div>
              <div className={barClassName} style={barStyle}></div>
            </div>

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
