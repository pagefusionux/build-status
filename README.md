# build-status

**Description**

This app works in conjunction with its partner PHP app (build-api or BAPI). It queries
the BAPI URL which, in turn, queries the Jenkins API which responds with a json object that
contains the status for the 4 branches (dev, release, production, and hotfix).

**Configuration**

For development and testing, the 'bapiUrl' variable (found in src/BuildStatus.js in the
constructor) is set to http://localhost.buildapi. This must eventually be changed to a 
production URL where the build-api is accessible.
