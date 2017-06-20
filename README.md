# build-status

**Description**

This app (created through create-react-app and converted to Preact) queries the Jenkins API
to return build status information (according to the requesting hostname) for all three
branches of the associated Jenkins v2-* project.

**Configuration**

This app works in conjunction with its partner PHP app (build-api or BAPI). It queries
the BAPI URL which, in turn, responds with a json object that holds the status for the 4 
branches (dev, release, production, and hotfix).

For development and testing, the 'bapiUrl' variable (found in src/BuildStatus.js in the
constructor) is set to http://localhost.buildapi. This must eventually be changed to a 
production URL where the build-api is accessible.
