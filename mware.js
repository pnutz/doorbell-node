var Group = require("./model/group");
var User = require("./model/user");

var uuid = require("node-uuid");

// TODO: complete route (addmember/results)
exports.createGroup = function(user, groupName, groupMembers, callback) {
  var results = {};
  var group;

  async.series([
    // check if groupName exists
    function(seriesCallback) {
      Group.getGroupByGroupName(user.id, groupName, function(err, group) {
        if (err) {
          return seriesCallback();
        } else {
          return seriesCallback(new Error(global.errorcode["Group name is not unique"]));
        }
      });
    },
    // generate group uuid
    function(seriesCallback) {
      var invalidUuid = true;
      uuid = generateUuid();

      async.whilst(
        function() { return invalidUuid; },
        function(whilstCallback) {
          Group.getGroupByUuid(uuid, function(err, returnedUser) {
            // no match, exit loop
            if (err) {
              invalidUuid = false;
            } else {
              uuid = generateUuid();
            }
            return whilstCallback();
          });
        },
        function(err) {
          results.uuid = uuid;
          return seriesCallback();
        });
    },
    function(seriesCallback) {
      group = new Group(null, groupName, user.id, uuid);
      group.save(function(id) {
        if (id != null) {
          return seriesCallback();
        } else {
          return seriesCallback(new Error(global.errorcode["Database insert error"]));
        }
      });
    },
    // add admin user to group
    function(seriesCallback) {
      var groupuser = new GroupUser(group.id, user.id, global.status["Admin"]);
      groupuser.save(function(id) {
        if (id == null) {
          results.members = [];
          var memberErr = { username: user.username, error: global.errorcode["Database insert error"] };
          results.members.push(memberErr);
        }
        return seriesCallback();
      });
    },
    // send member group requests
    function(seriesCallback) {
      if (groupMembers != null && groupMembers.length > 0) {
        async.eachSeries(groupMembers, function(member, eachCallback) {
          module.exports.addMember(group.id, member, function(err) {
            if (err) {
              if (!results.hasOwnProperty(members)) {
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
      } else {
        return seriesCallback();
      }
    }
  ], function(err, asyncResults) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, results);
    }
  });
};

exports.addMember = function(idGroup, username, callback) {
  var user;

  async.series([
    // get user
    function(seriesCallback) {
      User.getUserByUsername(username, function(err, returnedUser) {
        if (err) {
          return seriesCallback(err);
        } else {
          user = returnedUser;
          return seriesCallback();
        }
      });
    },
    // add groupuser
    function(seriesCallback) {
      var groupuser = new GroupUser(idGroup, user.id, global.status["Pending"]);
      groupuser.save(function(id) {
        if (id != null) {
          return seriesCallback();
        } else {
          return seriesCallback(new Error(global.errorcode["Database insert error"]));
        }
      });
    },
    // send push notification
    function(seriesCallback) {
      // TODO: add push notification
      return seriesCallback();
    }
  ], function(err, results) {
    if (err) {
      console.log("error: " + err.message);
    }
    return callback(err);
  });
};

exports.deleteMember = function(idGroup, username, callback) {
  var user;
  var groupuser;

  async.series([
    // get user
    function(seriesCallback) {
      User.getUserByUsername(username, function(err, returnedUser) {
        if (err) {
          return seriesCallback(err);
        } else {
          user = returnedUser;
          return seriesCallback();
        }
      });
    },
    // add groupuser
    function(seriesCallback) {
      GroupUser.getGroupUserById(idGroup, user.id, function(err, returnedGroupUser) {
        if (err) {
          return seriesCallback(err);
        } else {
          groupuser = returnedGroupUser;
          return seriesCallback();
        }
      });
    },
    // update groupuser status
    function(seriesCallback) {
      groupuser.idStatus = global.status["Deleted"];
      groupuser.save(function() {
        return seriesCallback();
      });
    }
  ], function(err, results) {
    if (err) {
      console.log("error: " + err.message);
    }
    return callback(err);
  });
};

// 6-4-4-4-12 HEX (34 characters)
function generateUuid() {
  // node-uuid format is 8-4-4-4-12 (timestamp based)
  return uuid.v1().substring(2);
}