import { h, Component } from 'preact';
import TreeView from 'react-treeview';
import loadingImg from '../images/loading.svg';
import moment from 'moment';
import '../css/BuildStatus.css';
import '../css/TreeView.css';

class BuildStatus extends Component {
  constructor(props) {
    super(props);

    this.bapiUrl = 'http://localhost.buildapi'; // location of the API that queries the Jenkins build server
    this.overrideHost = 'west.frontier.com'; // for testing (override window.location.host)

    this.state = {
      loading: 1,
      error: '',
      host: window.location.host,
      project: '',
      branches: [],
      commitsHotfix: [],
      commitsDev: [],
      commitsRelease: [],
      commitsProd: [],
    }
  }

  getStatus(option) {
    let host = window.location.host;
    let error = '';

    if (this.overrideHost) {
      host = this.overrideHost;
    }

    fetch(`${this.bapiUrl}?host=${host}&option=${option}`)
    .then((response) => {

      if (this.state.loading) {
        setTimeout(() => {
          this.setState({
            loading: 0
          });
        }, 300);
      }
      return response.json();
    })
    .then((data) => {

      console.log(`API response (${option}): `, data);

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
          setTimeout(() => { // update every 3 seconds
              this.getStatus('status');
            }, 5000
          );
        } else { // check every 30 seconds for any update (or re-build); and retrieve commit info
          setTimeout(() => {
              this.getStatus('status-commits');
            }, 30000
          );
        }
      }

    })
    .catch(() => {
      this.setState({
        error: 'Fetch API failed (general failure).'
      });
    })
  }

  componentDidMount() {
    this.getStatus('status-commits');
  };

  render() {

    let {
      error,
      loading,
      project,
      host,
      branches,
    } = this.state;

    function outputHTMLStr(str) {
      return {__html: str};
    };

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


        if (loading) {
          branchRows = (
            <p className="loading-container"><img className="loadingImg" src={loadingImg} alt="Loading..."/></p>
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
            branchRows = (
              <p>Error: {error}</p>
            );
          } else {

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

            } else if (percentage === 100 && result !== 'SUCCESS' && result !== 'FAILURE' && result !== 'ABORTED') { // estimatedDuration passed
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

            if (percentage >= 55) {
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
                    <strong>Branch:</strong> <span className="branch-name">{project}/{branchName}</span> <span className="build-number-sm">#{number}</span><br />
                    <strong>Started:</strong> {timestampConv}<br />
                    <div dangerouslySetInnerHTML={outputHTMLStr(resultText)}/>
                  </div>
                  <div className="status-right">
                    <div className="build-number">
                      #{number}
                    </div>
                  </div>
                </div>

                <div className="progress">
                  <div className="percentage" style={percentageStyle}>{percentageText}</div>
                  <div className={barClassName} style={barStyle}></div>
                </div>

                <div className="commits-container">
                  <TreeView key='root' nodeLabel='Commits' defaultCollapsed={true}>

                    {commits.length > 0 ? '' : (<div className="no-commits">No new commits are applied for this build.</div>)}

                    {commits.map((node, i) => {
                      const label = <span className="node">Set {i + 1}</span>;

                      return (
                        <TreeView key={i} nodeLabel={label} defaultCollapsed={true}>
                          {node.items.map((item, j) => {
                            const commitId = item.commitId.substring(0, 7);
                            const label2 = <span className="node"><span className="commitId">{commitId}</span>: {item.msg}</span>;
                            const commitDate = moment(item.date).format('MMM D, YYYY; h:mm:ss A');
                            //const commitDate = item.date;

                            return (
                              <TreeView nodeLabel={label2} key={j} defaultCollapsed={true}>
                                <div className="info-container">
                                  <div className="info"><span className="label-author">Author:</span> {item.authorEmail}
                                  </div>
                                  <div className="info"><span className="label-date">Date:</span> {commitDate}</div>
                                  <div className="info"><span className="label-files">Files Changed:</span></div>
                                  <div className="files-container">
                                    {item.paths.map((path, k) => {

                                      let editTypeSym = '';

                                      if (path.editType === 'add') {
                                        editTypeSym = <span className="type-add">+</span>;
                                      } else if (path.editType === 'edit') {
                                        editTypeSym = <span className="type-edit">✎</span>;
                                      } else if (path.editType === 'delete') {
                                        editTypeSym = <span className="type-delete">-</span>;
                                      }

                                      return (
                                        <div className="file">{editTypeSym} {path.file}</div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </TreeView>
                            );
                          })}
                        </TreeView>
                      );
                    })}
                  </TreeView>
                </div>

                <div className="branch-sep"></div>
              </div>
            );
          }
        }
      }
    }

    return (
      <div className="BuildStatus">
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
