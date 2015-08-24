var http = require("http");
var sys = require("sys");
var url = require("url");
var async = require("async");
var express = require("express");
var bodyParser = require("body-parser");

var Init = require("./mysql_db/dbInit");
var User = require("./model/user");
var Friend = require("./model/friend");
var Group = require("./model/group");
var GroupUser = require("./model/groupuser");
var auth = require("./auth");
var mware = require("./mware");

var requestCount = 0;
var port = "8888";

function start() {
  global.app = express();

  global.app.set("jwtTokenSecret", "totallySeCuRe_FORreleaseC=");
  global.app.use(bodyParser.json());
  
  // use heroku's environment port (not assigned port)
  var server = global.app.listen(process.env.PORT || port, function() {
    console.log("Express Server Listening on Port %d in %s mode", server.address().port, global.app.settings.env);
  });
  
  console.log("Server Started");
  
  global.app.get('/', function(req, res) {
    res.status(500).send("you messed up!");
  });
  
  global.app.post('/register', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    if (params.username != null && params.password != null && params.email != null) {
      auth.signUp(params.username, params.password, params.email, function(err, user, token) {
        if (err) {
          console.log("error: " + err.message);
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
      console.log("invalid parameters for register route");
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
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for devicetoken route");
      decrementRequestCount();
    }
  });

  global.app.post('/login', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    
    if (params.username != null && params.password != null) {
      auth.logIn(username, password, function(err, token) {
        if (err) {
          console.log("error: " + err.message);
          res.status(401).send({ error: err.message });
        } else {
          res.send({ token: token });
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for login route");
      decrementRequestCount();
    }
  });

  global.app.post('/addfriend', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var friend;

    if (params.username != null && params.token != null &&
        (params.friendUsername != null || friendMajor != null && friendMinor != null)) {
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
        // get friend by username
        function(seriesCallback) {
          if (params.friendUsername != null) {
            User.getUserByUsername(params.friendUsername, function(err, user) {
              if (err) {
                res.status(500).send({ error: err.message });
                return seriesCallback(err);
              } else {
                friend = user;
                return seriesCallback();
              }
            });
          } else {
            return seriesCallback();
          }
        },
        // get friend by bluetooth sync
        function(seriesCallback) {
          if (friend == null) {
            User.getUserByUuid(params.friendMajor, params.friendMinor, function(err, user) {
              if (err) {
                res.status(500).send({ error: err.message });
                return seriesCallback(err);
              } else {
                friend = user;
                return seriesCallback();
              }
            });
          } else {
            return seriesCallback();
          }
        },
        // add friend
        function(seriesCallback) {
          var newFriend = new Friend(user.id, friend.id, global.status["Pending"]);
          newFriend.save(function(id) {
            if (id != null) {
              var response;
              // response for add friend by username
              if (params.friendUsername != null) {
                response = {
                  friendMajor: friend.majorUuid,
                  friendMinor: friend.minorUuid
                };
              }
              // response for add friend by bluetooth
              else {
                response = { username: friend.username };
              }
              res.send(response);
              // TODO: push notification for friend request
              return seriesCallback();
            } else {
              var err = new Error(global.errorcode["Database insert error"]);
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            }
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for addfriend route");
      decrementRequestCount();
    }
  });

  global.app.post('/acceptfriend', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var friendUser;
    var friend;
    var results = {};

    if (params.username != null && params.token != null && params.friendUsername != null) {
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
        // get friend user
        function(seriesCallback) {
          User.getUserByUsername(params.friendUsername, function(err, returnedUser) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              friendUser = returnedUser;
              return seriesCallback();
            }
          });
        },
        // get friend
        function(seriesCallback) {
          Friend.getFriendById(friend.id, user.id, function(err, returnedFriend) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              friend = returnedFriend;
              return seriesCallback();
            }
          });
        },
        // update groupuser status
        function(seriesCallback) {
          friend.idStatus = global.status["Accepted"];
          friend.save(function() {
            res.send({ success: true });
            return seriesCallback();
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for acceptfriend route");
      decrementRequestCount();
    }
  });

  global.app.post('/rejectfriend', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var friendUser;
    var friend;
    var results = {};

    if (params.username != null && params.token != null && params.friendUsername != null) {
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
        // get friend user
        function(seriesCallback) {
          User.getUserByUsername(params.friendUsername, function(err, returnedUser) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              friendUser = returnedUser;
              return seriesCallback();
            }
          });
        },
        // get friend
        function(seriesCallback) {
          Friend.getFriendById(friend.id, user.id, function(err, returnedFriend) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              friend = returnedFriend;
              return seriesCallback();
            }
          });
        },
        // update groupuser status
        function(seriesCallback) {
          friend.idStatus = global.status["Rejected"];
          friend.save(function() {
            res.send({ success: true });
            return seriesCallback();
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for rejectfriend route");
      decrementRequestCount();
    }
  });

  global.app.post('/addgroup', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;

    if (params.username != null && params.token != null && params.groupName != null) {
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
        // add group
        function(seriesCallback) {
          mware.createGroup(user, params.groupName, params.members, function(err, results) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              res.send(results);
              return seriesCallback();
            }
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for addgroup route");
      decrementRequestCount();
    }
  });

  global.app.post('/addmember', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var group;
    var results = {};

    if (params.username != null && params.token != null
        && params.groupName != null && params.members != null && params.members > 0) {
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
        // get group
        function(seriesCallback) {
          Group.getGroupByGroupName(user.id, params.groupName, function(err, returnedGroup) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              group = returnedGroup;
              return seriesCallback();
            }
          });
        },
        // add members
        function(seriesCallback) {
          async.eachSeries(params.members, function(member, eachCallback) {
            mware.addMember(group.id, member, function(err) {
              if (err) {
                if (!results.hasOwnProperty("members")) {
                  results.members = [];
                }
                var memberErr = { username: member, error: err.message };
                results.members.push(memberErr);
              }
              return eachCallback();
            });
          }, function(err) {
            if (err) {
              return seriesCallback(err);
            } else {
              return seriesCallback();
            }
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        } else {
          if (!results.hasOwnProperty("members")) {
            results.success = true;
          }
          res.send(results);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for addmember route");
      decrementRequestCount();
    }
  });

global.app.post('/deletemember', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var group;
    var results = {};

    if (params.username != null && params.token != null && params.groupName != null
          && params.members != null && params.members.length > 0) {
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
        // get group
        function(seriesCallback) {
          Group.getGroupByGroupName(user.id, params.groupName, function(err, returnedGroup) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              group = returnedGroup;
              return seriesCallback();
            }
          });
        },
        // delete members
        function(seriesCallback) {
          async.eachSeries(params.members, function(member, eachCallback) {
            mware.deleteMember(group.id, member, function(err) {
              if (err) {
                if (!results.hasOwnProperty("members")) {
                  results.members = [];
                }
                var memberErr = { username: member, error: err.message };
                results.members.push(memberErr);
              }
              return eachCallback();
            })
          }, function(err) {
            if (err) {
              return seriesCallback(err);
            } else {
              return seriesCallback();
            }
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        } else {
          if (!results.hasOwnProperty("members")) {
            results.success = true;
          }
          res.send(results);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for deletemember route");
      decrementRequestCount();
    }
  });

  global.app.post('/acceptgroup', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var group;
    var groupuser;
    var results = {};

    if (params.username != null && params.token != null && params.uuid != null) {
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
        // get group
        function(seriesCallback) {
          Group.getGroupByUuid(uuid, function(err, returnedGroup) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              group = returnedGroup;
              return seriesCallback();
            }
          });
        },
        // get groupuser
        function(seriesCallback) {
          GroupUser.getGroupUserById(group.id, user.id, function(err, returnedGroupuser) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              groupuser = returnedGroupuser;
              return seriesCallback();
            }
          });
        },
        // update groupuser status
        function(seriesCallback) {
          groupuser.idStatus = global.status["Accepted"];
          groupuser.save(function() {
            res.send({ success: true });
            return seriesCallback();
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for acceptgroup route");
      decrementRequestCount();
    }
  });

  global.app.post('/rejectgroup', function(req, res) {
    incrementRequestCount();
    var params = req.body;
    var user;
    var group;
    var groupuser;
    var results = {};

    if (params.username != null && params.token != null && params.uuid != null) {
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
        // get group
        function(seriesCallback) {
          Group.getGroupByUuid(uuid, function(err, returnedGroup) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              group = returnedGroup;
              return seriesCallback();
            }
          });
        },
        // get groupuser
        function(seriesCallback) {
          GroupUser.getGroupUserById(group.id, user.id, function(err, returnedGroupuser) {
            if (err) {
              res.status(500).send({ error: err.message });
              return seriesCallback(err);
            } else {
              groupuser = returnedGroupuser;
              return seriesCallback();
            }
          });
        },
        // update groupuser status
        function(seriesCallback) {
          groupuser.idStatus = global.status["Rejected"];
          groupuser.save(function() {
            res.send({ success: true });
            return seriesCallback();
          });
        }
      ], function(err, results) {
        if (err) {
          console.log("error: " + err.message);
        }
        decrementRequestCount();
      });
    } else {
      console.log("invalid parameters for rejectgroup route");
      decrementRequestCount();
    }
  });
}

function incrementRequestCount() {
  requestCount++;
  console.log("Concurrent Requests: " + requestCount);
}

function decrementRequestCount() { requestCount--; }

module.exports = {
  start: start
};