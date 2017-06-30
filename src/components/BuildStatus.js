import { h, Component } from 'preact';
import ProgressBar from './ProgressBar';
import TreeViewArea from './TreeViewArea';
import loadingImg from '../images/loading.svg';
import moment from 'moment';
import '../scss/BuildStatus.css';
import '../scss/TreeView.css';

class BuildStatus extends Component {
  constructor(props) {
    super(props);

    this.bapiUrl = 'http://buildstatus.clear.link/bapi'; // location of the API that queries the Jenkins build server
    this.bapiDevUrl = 'http://localhost.buildapi';
    this.overrideHost = 'attsavings.com'; // for testing (override window.location.host)

    this.state = {
      loading: 1,
      apiConnected: false,
      bapiUrlUsed: this.bapiUrl,
      error: '',
      host: '',
      project: '',
      branches: [],
      commitsHotfix: [],
      commitsDev: [],
      commitsRelease: [],
      commitsProd: [],
    }
  }

  getParameterByName(name, url) {
    if (!url) url = window.location.href;

    // eslint-disable-next-line
    name = name.replace(/[\[\]]/g, "\\$&");

    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);

    if (!results) return null;

    if (!results[2]) return '';

    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  getStatus(option) {
    let host = window.location.host;
    let bapiUrl = this.bapiUrl;
    let error = '';

    // if apache redirects used (.htaccess), get host name from URL path (e.g. http://[where.this.is.hosted]/west.frontier.com)
    const pathArray = window.location.pathname.split('/');
    const segment1 = pathArray[1];

    // get host parameter from query string
    let hostParam = this.getParameterByName('host');
    if (!hostParam) {
      hostParam = '';
    }

    if (segment1.length > 0) { // apache redirect mod must be setup to work
      host = segment1;
    } else if (hostParam.length > 0) {
      host = hostParam;
    } else if (this.overrideHost.length > 0) {
      host = this.overrideHost;
    } else {
      host = 'attsavings.com'; // default
    }

    // testing environment
    if (window.location.host === 'localhost:3000') {
      bapiUrl = this.bapiDevUrl;
    }

    this.setState({
      bapiUrlUsed: bapiUrl,
    });

    fetch(`${bapiUrl}?host=${host}&option=${option}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {

      //console.log(`API response (${option}): `, data);

      // check for API response error messages
      if (({}.toString.call(data.messages) === '[object Object]')) {
        for (let p in data.messages) {
          if (data.messages.hasOwnProperty(p)) {
            console.log(data.messages);
          }
        }

        this.setState({
          error: 'API exception occurred. (See console log.)'
        });
        error = 1;
      }

      if (!error) {

        if (option === 'status-commits') {
          this.setState({
            loading: 0,
            error: null,
            host: data.host,
            project: data.project,
            branches: data.branches,
            commitsHotfix: data.branches.hotfix.lastBuild.changeSets,
            commitsDev: data.branches.dev.lastBuild.changeSets,
            commitsRelease: data.branches.release.lastBuild.changeSets,
            commitsProd: data.branches.production.lastBuild.changeSets,
          });
        } else {
          this.setState({
            loading: 0,
            error: null,
            host: data.host,
            project: data.project,
            branches: data.branches,
          });
        }

        let continueToUpdateStatus = 1;

        if ((data.branches.hotfix.lastBuild.result === 'SUCCESS' || data.branches.hotfix.lastBuild.result === 'FAILURE' || data.branches.hotfix.lastBuild.result === 'ABORTED')
            &&
            (data.branches.dev.lastBuild.result === 'SUCCESS' || data.branches.dev.lastBuild.result === 'FAILURE' || data.branches.dev.lastBuild.result === 'ABORTED')
            &&
            (data.branches.release.lastBuild.result === 'SUCCESS' || data.branches.release.lastBuild.result === 'FAILURE' || data.branches.release.lastBuild.result === 'ABORTED')
            &&
            (data.branches.production.lastBuild.result === 'SUCCESS' || data.branches.production.lastBuild.result === 'FAILURE' || data.branches.production.lastBuild.result === 'ABORTED')) {

          continueToUpdateStatus = 0;
        }

        if (continueToUpdateStatus === 1) {
          setTimeout(() => { // update every 3 seconds (if we're updating progress bars)
              this.getStatus('status');
            }, 5000
          );
        } else { // check every 30 seconds for any update (or re-build); and retrieve commit info
          setTimeout(() => {
              this.getStatus('status-commits');
            }, 30000
          );
        }

        this.setState({
          apiConnected: true,
          showApiConnectedMsg: false,
        });
      }

    })
    .catch(() => {
      this.setState({
        error: 'Fetch API failed (general failure).'
      });
    })
  }

  checkApiConnected() {
    if (this.state.apiConnected === false) {
      this.setState({
        error: `API failed to connect. Check to see that the build-api service at ${this.state.bapiUrlUsed} is available.`,
      });
    }
  }

  componentDidMount() {

    setTimeout(() => { // check after app load if API connected
      this.getStatus('status-commits');
      }, 500
    );

    setTimeout(() => { // check after app load if API connected
        this.checkApiConnected();
      }, 7000
    );
  };

  render() {

    let {
      error,
      loading,
      //project,
      host,
      branches,
    } = this.state;

    function outputHTMLStr(str) {
      return {__html: str};
    }

    let branchRows = [];
    let hostStr = '';

    if (typeof branches.hotfix !== 'undefined') {

      let branchName = '';
      for (let r = 0; r < 4; r+=1) {
        let commits = [];
        let lastBuild = {};

        if (r === 0) {
          lastBuild = branches.hotfix.lastBuild;
          commits = this.state.commitsHotfix;
          branchName = 'hotfix';
        } else if (r === 1) {
          lastBuild = branches.dev.lastBuild;
          commits = this.state.commitsDev;
          branchName = 'dev';
        } else if (r === 2) {
          lastBuild = branches.release.lastBuild;
          commits = this.state.commitsRelease;
          branchName = 'release';
        } else if (r === 3) {
          lastBuild = branches.production.lastBuild;
          commits = this.state.commitsProd;
          branchName = 'production';
        }

        //console.log('lastBuild', lastBuild);

        let number = lastBuild.number;
        let result = lastBuild.result;
        let timestamp = lastBuild.timestamp;
        let estimatedDuration = lastBuild.estimatedDuration;
        let duration = lastBuild.duration;

        let percentage = 0;
        let resultText = '';
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

        // get percentage (using time started and estimated duration)
        percentage = Math.round((new Date().getTime() - timestamp) / estimatedDuration * 100);

        // limit percentage to 100
        if (percentage > 100 || duration > 0) {
          percentage = 100;
        }

        let percentageText = `${percentage}%`
        let barClassName = 'bar';
        let barTopRightRadius = 0;
        let barBottomRightRadius = 0;
        let percentageColor = '#000';

        if (percentage === 100 && result === 'SUCCESS') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-success';
          resultText = `<strong>Ended:</strong> ${endTimestampConv} (${durationConv})`;
          percentageText = 'SUCCESS';

        } else if (percentage > 80 && result !== 'SUCCESS' && result !== 'FAILURE' && result !== 'ABORTED') {
          resultText = `<strong>Status:</strong> Deploying: ${timeElapsed} (est. ${estimatedDurationConv})`;

        } else if (percentage >= 100 && result !== 'SUCCESS' && result !== 'FAILURE' && result !== 'ABORTED') { // estimatedDuration passed
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          resultText = `<strong>Status:</strong> Still Deploying: ${timeElapsed}`;
          percentageText = 'ALMOST DONE...';

        } else if (result === 'FAILURE') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-failure';
          resultText = `<strong>Ended:</strong> ${endTimestampConv} (${durationConv})`;
          percentageText = 'FAILED';

        } else if (result === 'ABORTED') {
          barTopRightRadius = 5;
          barBottomRightRadius = 5;
          barClassName = 'bar-aborted';
          resultText = `<strong>Ended:</strong> ${endTimestampConv} (${durationConv})`;
          percentageText = 'ABORTED';

        } else {
          resultText = `<strong>Status:</strong> Building: ${timeElapsed} (est. ${estimatedDurationConv})`;
        }

        let barStyle = {
          width: `${percentage}%`,
          zIndex: 1,
          borderTopRightRadius: `${barTopRightRadius}px`,
          borderBottomRightRadius: `${barBottomRightRadius}px`,
        };

        if (percentage >= 50) {
          percentageColor = '#fff';
        }

        let percentageStyle = {
          color: `${percentageColor}`,
        };

        // place a wbr tag in hostname so it can wrap decently
        hostStr = host;
        hostStr = hostStr.replace('.clearlink', '<wbr/>.clearlink');

        let rowClassName = `branch-row branch-${branchName}`;

        branchRows[r] = (
          <div className={rowClassName}>

            <div className="status-areas">
              <div className="status-left">
                <strong>Branch:</strong> <span className="branch-name">{branchName}</span> <span className="build-number-sm">(Build #{number})</span><br />
                <strong>Started:</strong> {timestampConv}<br />
                <div dangerouslySetInnerHTML={outputHTMLStr(resultText)}/>
              </div>
              <div className="status-right">
                <div className="build-number">
                  #{number}
                </div>
              </div>
            </div>

            <ProgressBar
              percentageStyle={percentageStyle}
              percentageText={percentageText}
              barClassName={barClassName}
              barStyle={barStyle}
            />

            <TreeViewArea commits={commits} />

            <div className="branch-sep"></div>
          </div>
        );
      }
    }

    if (!hostStr) {
      hostStr = 'Loading...';
    }

    if (loading) {
      branchRows = (
        <p className="loading-container"><img className="loadingImg" src={loadingImg} alt="Loading..."/></p>
      );
    }

    if (error) {
      hostStr = 'Error';
      branchRows = (
        <p className="error-container">{error}</p>
      );
    }

    return (
      <div className="build-status">
        <div className="status-container">
          <div className="host">
            <div dangerouslySetInnerHTML={outputHTMLStr(hostStr)} />
          </div>

          <div className="vsep"></div>

          {branchRows}
        </div>
      </div>
    );
  }
}

export default BuildStatus;
