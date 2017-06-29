# build-status

**Description**

This app works in conjunction with its partner PHP app _build-api_ (see https://github.com/pagefusionux/build-api). It queries
build-api (used as an authentication proxy) which queries the Jenkins API using cURL. The Jenkins 
server responds with json object that contains build status information. This app just outputs 
the returned information in a pretty way.

The progress bar percentage is figured by taking the estimatedDuration timestamp (provided by Jenkins) and
comparing that with the timestamp the app is initially loaded. Unfortunately, the progress bar could reach
100% and just sit there because any build process could take longer than the estimatedDuration time. To 
mitigate, the status changes from 'Deploying' to 'Still Deploying...' until a SUCCESS, FAILURE, or 
ABORTED result is returned.

**Usage**

Let's say a developer for _centurylinkquote.com_ wishes to check the build status. He'd specify the
 URL as follows:
 ````
 http://[where.this.is.hosted]/centurylinkquote.com
 ````
The 'centurylinkquote.com' segment of the URL path may be changed to see the status for any v2-*
project. If no project is specified, the app will check for the 

**Reload Timing**

After this app is initially loaded, it will query BAPI every 5 seconds for updated information. If 
none is forthcoming (according to status) the app will wait 30 seconds before rechecking (in case
a rebuild occurs, or something).

**Configuration**

For development and testing, the _bapiUrl_ variable (found in _src/BuildStatus.js_ in the
constructor) is set to http://localhost.buildapi. This must eventually be changed to a 
production URL where the build-api PHP app is accessible.
