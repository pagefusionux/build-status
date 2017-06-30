import { h, Component } from 'preact';
import TreeView from 'react-treeview';
import addImg from '../images/add.svg';
import editImg from '../images/edit.svg';
import deleteImg from '../images/delete.svg';
import moment from 'moment';
import '../scss/TreeView.css';

class TreeViewArea extends Component {
  render() {

    const commits = this.props.commits;

    return (
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
                  const commitDate = moment(item.date, 'YYYY-MM-DD HH:mm:ss ZZ').format('MMM D, YYYY; h:mm:ss A');

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
                              editTypeSym = <span className="type-add"><img src={addImg} alt="File added." /></span>;
                            } else if (path.editType === 'edit') {
                              editTypeSym = <span className="type-edit"><img src={editImg} alt="File edited." /></span>;
                            } else if (path.editType === 'delete') {
                              editTypeSym = <span className="type-delete"><img src={deleteImg} alt="File deleted." /></span>;
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
    );
  }
}

export default TreeViewArea;
