var User = require('./model/user');

var async = require ('async');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');
var rand = require('random-seed').create();

// sign up route
exports.signUp = function(username, password, email, callback) {
  var user;
  var majorUuid;
  var minorUuid;

  async.series([
    // check if username is in db
    function(seriesCallback) {
      User.getUserByUsername(username, function(err, userResult) {
        if (!userResult) {
          return seriesCallback();
        } else {
          return seriesCallback(new Error(global.errorcode['Username taken']));
        }
      });
    },
    // check if email is in db
    function(seriesCallback) {
      User.getUserByEmail(email, function(err, userResult) {
        if (!userResult) {
          return seriesCallback();
        } else {
          return seriesCallback(new Error(global.errorcode['Email taken']));
        }
      });
    },
    // generate unique major and minor uuids
    function(seriesCallback) {
      var flag = 1;
      // random from 0 to 32767
      majorUuid = rand(32768);
      // random from 0 to 4095
      minorUuid = rand(4096);

      async.whilst(
        function() { return flag != 0; },
        function(whilstCallback) {
          User.getUserByUuid(majorUuid, minorUuid, function(err, userResult) {
            // no match, exit loop
            if (!userResult) {
              flag = 0;
            } else if (flag == 1) {
              flag = 2;
              majorUuid = rand(32768);
            } else {
              flag = 1;
              minorUuid = rand(4096);
            }
            return whilstCallback();
          });
        },
        function(err) {
          return seriesCallback();
        });
    },
    function(seriesCallback) {
      // hash password
      password = bcrypt.hashSync(password, 8);

      user = new User(null, username, password, majorUuid, minorUuid, email);
      user.save(function(id) {
        if (id != null) {
          return seriesCallback();
        } else {
          return seriesCallback(new Error(global.errorcode['Database insert error']));
        }
      });
    }
  ], function(err, results) {
    if (err) {
      return callback(err);
    } else {
      var token = generateToken(user);
      return callback(null, user, token);
    }
  });
};

// log in route
exports.logIn = function(username, password, callback) {
  var user;
  var token;

  async.series([
    // check if user exists
    function(seriesCallback) {
      User.getUserByUsername(username, function(err, userResult) {
        if (err) {
          return seriesCallback(new Error(global.errorcode['Username does not exist']));
        } else {
          user = userResult;
          return seriesCallback();
        }
      });
    },
    // check if password matches
    function(seriesCallback) {
      if (bcrypt.compareSync(password, user.password)) {
        token = generateToken(user);
        return seriesCallback();
      } else {
        return seriesCallback(new Error(global.errorcode['Incorrect password']));
      }
    }
  ], function(err, results) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, user, token);
    }
  });
};

// token authentication route
/**
 * @brief Authenticates a user token
 * @params sUsername name of user to search for
 * @params sToken token string
 * @params fnCallback callback 
 * @returns User object through fnCallback
 */
exports.authToken = function(sUsername, sToken, fnCallback) {
  // Verify input
  if (sUsername == null || sToken == null)
      return fnCallback(new Error('Invalid username/token'));

  try {
    var decoded = jwt.decode(sToken, app.get('jwtTokenSecret'));

    if (decoded.exp <= Date.now()) {
      return fnCallback(new Error(global.errorcode['Expired token']));
    }

    // Fetch user object
    User.getUserByUsername(sUsername, function(err, oRetrievedUser) {
      if (err) {
        return fnCallback(err);
      }

      if (oRetrievedUser == null) {
        return fnCallback(new Error(global.errorcode['Username does not exist']));
      }
      
      if (oRetrievedUser.id != decoded.iss) {
        return fnCallback(new Error(global.errorcode['Token does not match user']));
      }

      // Success
      return fnCallback(err, oRetrievedUser);
    });

  } catch (err) {
    return fnCallback(new Error(global.errorcode['Invalid token']));
  }
};

// token expires in 7 days
function generateToken(user) {
  var expires = moment().add(7, 'days').valueOf();
  var token = jwt.encode({
                            iss: user.id,
                            exp: expires
                          }, global.app.get('jwtTokenSecret'));
  return token;
}
