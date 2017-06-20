# build-status

**Description**

This app works in conjunction with its partner PHP app _build-api_ (see https://github.com/pagefusionux/build-api). It queries
build-api (used as an authentication proxy) which queries the Jenkins API using cURL. The Jenkins 
server responds with json object that contains build status information. This app just outputs 
the returned information in a pretty way.

**Usage**

Let's say a developer for _centurylinkquote.com_ has just created a new feature branch which
has been approved and merged into the 'dev' branch for the 'v2-centurylinkquote' Jenkins project. 

To see the build status, this developer would then go to 
http://centurylinkquote.dev.aws.clearlink.com/status. This '/status' route points to where this 
_build-status_ app resides. 

The BAPI PHP app uses the 'centurylinkquote' and '.dev.' portions of the URL to determine which 
Jenkins project and branch to return information for.

**Reload Timing**

After this app is initially loaded, it will query BAPI every 3 seconds for updated information. If 
none is forthcoming (according to status) the app will wait 30 seconds before rechecking (in case
a rebuild occurs, or something).

**Configuration**

For development and testing, the _bapiUrl_ variable (found in _src/BuildStatus.js_ in the
constructor) is set to http://localhost.buildapi. This must eventually be changed to a 
production URL where the build-api PHP app is accessible.
