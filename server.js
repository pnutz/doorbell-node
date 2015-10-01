var http = require('http');
var sys = require('sys');
var url = require('url');
var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var debug = require('debug')('server');

var Init = require('./mysql_db/dbInit');
var User = require('./model/user');
var Friend = require('./model/friend');
var auth = require('./auth');
var push = require('./push');

var requestCount = 0;
var port = '8888';

function handleResponse(res, err, results) {
  if (err) {
    console.log('error: ' + err.message);
    res.status(500).send({ error: err.message });
  } else {
    res.send(results);
  }
  decrementRequestCount();
}

function sendError(err, res) {
  if (err) {
    console.log('error: ' + err.message);
    res.status(500).send({ error: err.message });
    decrementRequestCount();
  }
}


function start() {
  global.app = express();

  global.app.set('jwtTokenSecret', 'totallySeCuRe_FORreleaseC=');
  global.app.use(bodyParser.json());
  
  // use heroku's environment port (not assigned port)
  var server = global.app.listen(process.env.PORT || port, function() {
    debug('Express Server Listening on Port %d in %s mode', server.address().port, global.app.settings.env);
  });
  
  debug('Server Started');
  
  global.app.get('/', function(req, res) {
    res.status(500).send('you messed up!');
  });
  
  global.app.post('/register', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var headers = req.headers;
    if (headers.username != null && headers.password != null && params.email != null) {
      auth.signUp(headers.username, headers.password, params.email, function(err, user, token) {
        if (err) {
          console.log('error: ' + err.message);
          res.status(500).send({ error: err.message });
        } else {
          var response = {
                            majorUuid: user.majorUuid,
                            minorUuid: user.minorUuid,
                            token: token
                          };
          res.send(response);
        }
        decrementRequestCount();
      });
    } else {
      console.log('invalid parameters for register route');
      decrementRequestCount();
    }
  });
  
  global.app.post('/devicetoken', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;

    if (params.username != null && params.token != null && params.deviceToken != null) {
      async.series([
        // authorize token
        function(seriesCallback) {
          auth.authToken(params.username, params.token, function(err, returnedUser) {
            if (err) {
              res.status(401).send({ error: err.message });
              return seriesCallback(err);
            } else {
              user = returnedUser;
              return seriesCallback();
            }
          });
        },
        // update user deviceToken
        function(seriesCallback) {
          user.deviceToken = params.deviceToken;
          user.save(function() {
            res.send({ success: true });
            return seriesCallback();
          });
        }
      ], function(err, results) {
        if (err) {
          console.log('error: ' + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log('invalid parameters for devicetoken route');
      decrementRequestCount();
    }
  });

  global.app.post('/login', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var headers = req.headers;
    if (headers.username != null && headers.password != null) {
      auth.logIn(headers.username, headers.password, function(err, user, token) {
        if (err) {
          console.log('error: ' + err.message);
          res.status(401).send({ error: err.message });
        } else {
          res.send({
            majorUuid: user.majorUuid,
            minorUuid: user.minorUuid,
            token: token,
          });
        }
        decrementRequestCount();
      });
    } else {
      console.log('invalid parameters for login route');
      decrementRequestCount();
    }
  });

  function addFriend(statusCode, oUser, oFriendUser, callback)
  {
    console.log('adding' + statusCode + ' ' + oUser.id + ' ' + oFriendUser.id);
    var newFriend = new Friend(oUser.id, oFriendUser.id, statusCode);
    newFriend.save(function(err, id) {
      var response = null;
      console.log('hey');
      if (!err) {
        console.log('Returning majoruuid ' + oFriendUser.majorUuid );
        response = {
          friendMajor: oFriendUser.majorUuid,
          friendMinor: oFriendUser.minorUuid,
          username: oFriendUser.username
        };
      } 
      return callback(err, response);
    });
  }

  // FIXME: this should be moved to JUST below the route handler for login
  // Catch all for authentication required requests
  global.app.all('*', function authenticateUser(req, res, next) {
    auth.authToken(req.headers.username, req.headers.token, function(err, oUser) {
      if (err) {
        console.log('Error authenticating');
        // If error then authentication failed
        res.status(401).send();
      } else {
        console.log('retrieved username ' + oUser.username);
        req.oUser = oUser;
        incrementRequestCount();
        next();
      }
    });
  });

  global.app.get('/user/:majorUuid/:minorUuid', function(req, res) {
    console.log('finding user by uuid');
    User.getUserByUuid(
      req.params.majorUuid, 
      req.params.minorUuid, 
      function(err, results) {
        if (err) {
          res.status(500).send({error : err.message});
        } else {
          console.log(results);
          res.send(results);
        }
      });
  });

  // FIXME: This should be modified accordingly to allow for filtering
  // currently this function is hacked for testing as I have no way of getting
  // major minor uuids
  global.app.get('/user', function(req, res) {
    console.log('finding user by username' + req.query.username);
    User.getUserByUsername(
      req.query.username, 
      function(err, results) {
        if (err) {
          res.status(500).send({error : err.message});
        } else {
          console.log(results);
          res.send(results);
        }
      });
  });

  global.app.get('/friend', function(req, res) {
    console.log('listing friends');
    async.waterfall([
      async.apply(Friend.getSingleColumnListByUser, req.oUser),
      User.getUsersByIdList
      ],
      function(err, results) {
        if (err) {
          res.status(500).send({error : err.message});
        } else {
          console.log(results);
          res.send(results);
        }
      });
  });

  
  global.app.delete('/friend/:majorUuid/:minorUuid', function(req, res) {
    console.log('Deleting friends');
    async.waterfall([
      async.apply(User.getUserByUuid, req.params.majorUuid, req.params.minorUuid),
      async.apply(Friend.deleteFriend, req.oUser) 
    ], function(err, results) {
        if (err) {
          res.status(500).send({error : err.message});
        } else {
          console.log(results);
          res.send(results);
        }
      });
  });

  global.app.post('/friend/:majorUuid/:minorUuid', function(req, res) {
    // Find friend
    User.getUserByUuid(req.params.majorUuid, req.params.minorUuid, function(err, oFriendUser) { 
      if (err) {
        return sendError(res, err);
      }
      // Determine which function to call based on params we received
      async.series([
        // Returns map of response
        async.apply(addFriend, global.status['Pending'], req.oUser, oFriendUser),
        // Send push
        function (callback) {
          console.log('sending push');
          var pushData = 'DOORKNOB! ' + req.oUser.username + ' has sent you a friend request.';
          push.sendPushNotification(oFriendUser.deviceToken, pushData, req.oUser.username, function(err) {
            if (err) { console.log('Push notification failed'); }
          });

          // Don't care if it fails
          callback();
        }
      ], // Main callback
      function (err, response) {
        // Return response based on the success of the add friend call
          console.log('sending response ' + response);
        handleResponse(res, err, response[0]);
      });

    });
  });

  global.app.put('/friend/accept?reject', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var newIdStatus = req.path == 'accept'
      ? global.status['Accepted']
      : global.status['Rejected'];

    async.waterfall([
      // get friend user
      async.apply(User.getUserByUsername, params.friendUsername),
      // get friend
      function(oFriendUser, callback) {
        Friend.getFriendById(req.oUser.id, oFriendUser.id, callback);
      },
      // update friend status
      function(oFriend, callback) {
        oFriend.idStatus = newIdStatus;
        oFriend.save(function() {
          res.send({ success: true });
          return callback(err, results);
        });
      }
    ], function(err) {
      if (err) {
        console.log('error: ' + err.message);
      }
      decrementRequestCount();
    });
  });
}

function incrementRequestCount() {
  requestCount++;
  debug('Concurrent Requests: ' + requestCount);
}

function decrementRequestCount() { requestCount--; }

module.exports = {
  start: start
};
