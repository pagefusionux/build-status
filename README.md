# build-status

**Description**

This app works in conjunction with its partner PHP app (build-api or BAPI). It queries
BAPI which then queries the Jenkins API using cURL. The Jenkins server responds with
json object that contains the status for the 4 branches (dev, release, production, and hotfix).
This app just formats that returned information in a pretty way.

**Timing**

After the app is loaded, it will query BAPI every 3 seconds for updated information. If none is
forthcoming (according to status) the app will wait 30 seconds before rechecking (in case
a rebuild occurs, or something).

**Configuration**

For development and testing, the 'bapiUrl' variable (found in src/BuildStatus.js in the
constructor) is set to http://localhost.buildapi. This must eventually be changed to a 
production URL where the build-api is accessible.
