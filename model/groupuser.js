// GroupUser class
var idGroup, _group, idUser, _user, idStatus, _status, createdAt, updatedAt;
var Access = require("./simple_table");
var User = require("./user");
var Group = require("./group");
var Status = require("./status");

// constructor
function GroupUser(idGroup, idUser, idStatus, createdAt, updatedAt) {
  if (idGroup == null || idUser == null || idStatus == null) {
    throw("GroupUser: invalid input");
  }
  
  this.idGroup = idGroup;
  this._group = null;
  this.idUser = idUser;
  this._user = null;
  this.idStatus = idStatus;
  this._status = null;
  this.createdAt = createdAt;
  this.updatedAt = updatedAt;
}

// save to db
GroupUser.prototype.save = function(callback) {
  var local = this;

  var post = {
    idGroup: local.idGroup,
    idUser: local.idUser,
    idStatus: local.idStatus
  };
  
  if (local.id == null) {
    post.createdAt = null;
    post.updatedAt = null;
    
    insertGroupUser(post, function(id) {
      return callback(id);
    });
  } else {
    updateGroupUser(local.idGroup, local.idUser, post, callback);
  }
};

function insertGroupUser(post, callback) {
  var query = db.query("INSERT INTO groupuser SET ?", post, function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log("Inserted ID " + result.insertId + " into GroupUser");
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateGroupUser(idGroup, idUser, post, callback) {
  var query = db.query("UPDATE groupuser SET ? WHERE idGroup = ? AND idUser = ?",
    [post, idGroup, idUser], function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log("Updated GroupUser with idGroup: " + idGroup + " and idUser: " + idUser);
    }
    return callback();
  });
  console.log(query.sql);
}

// GET: group
Object.defineProperty(GroupUser.prototype, "group", {
  set: function() {
    var local = this;
    if (local._group == null) {
      Group.getGroupById(local.idGroup, function(group) {
        local._group = group;
        callback(local._group);
      });
    } else {
      callback(local._group);
    }
  }
});

// GET: user
Object.defineProperty(GroupUser.prototype, "user", {
  set: function() {
    var local = this;
    if (local._user == null) {
      User.getUserById(local.idUser, function(user) {
        local._user = user;
        callback(local._user);
      });
    } else {
      callback(local._user);
    }
  }
});

// GET: status
Object.defineProperty(GroupUser.prototype, "status", {
  set: function() {
    var local = this;
    if (local._status == null) {
      Status.getStatusById(local.idGroupUser, function(status) {
        local._status = status;
        callback(local._status);
      });
    } else {
      callback(local._status);
    }
  }
});

GroupUser.getGroupUserById = function(idGroup, idUser, callback) {
  var query = "SELECT * FROM groupuser WHERE idGroup = " + idGroup + " AND idUser = " +
                idUser + ";";
  db.query(query, function(err, result) {
    if (err) {
      console.log(query);
      console.log(err.message);
      return callback(err);
    } else if (result.length === 0) {
      return callback(new Error("No GroupUser with idGroup " + idGroup + " and idUser " +
                      idUser));
    } else {
      var groupuser = new GroupUser(result[0].idGroup, result[0].idUser,
        result[0].idStatus, result[0].createdAt, result[0].updatedAt);
      return callback(null, groupuser);
    }
  });
};

GroupUser.getUsersByGroup = function(idGroup, callback) {
  Access.selectByColumn("groupuser", "idGroup", idGroup, "", function(result) {
    if (result != null) {
      var groupusers = [];
      for (var i = 0; i < result.length; i++) {
        var groupuser = new GroupUser(result[0].idGroup, result[0].idUser,
          result[0].idStatus, result[0].createdAt, result[0].updatedAt);
        groupusers.push(groupuser);
      }
      return callback(null, groupusers);
    } else {
      return callback(new Error("No GroupUsers for idGroup " + idGroup));
    }
  });
};

GroupUser.getGroupsByUser = function(idUser, callback) {
  Access.selectByColumn("groupuser", "idUser", idUser, "", function(result) {
    if (result != null) {
      var groupusers = [];
      for (var i = 0; i < result.length; i++) {
        var groupuser = new GroupUser(result[0].idGroup, result[0].idUser,
          result[0].idStatus, result[0].createdAt, result[0].updatedAt);
        groupusers.push(groupuser);
      }
      return callback(null, groupusers);
    } else {
      return callback(new Error("No GroupUsers for idUser" + idUser));
    }
  });
};

GroupUser.getUsersByGroupStatus = function(idGroup, idStatus, callback) {
  var query = "SELECT * FROM groupuser WHERE idGroup = " + idGroup + " AND idStatus = " +
                idStatus + ";";
  db.query(query, function(err, result) {
    if (err) {
      console.log(query);
      console.log(err.message);
      return callback(err);
    } else if (result == null) {
      return callback(new Error("No GroupUsers for idGroup " + idGroup + " with idStatus " +
                      idStatus));
    } else {
      var groupusers = [];
      for (var i = 0; i < result.length; i++) {
        var groupuser = new GroupUser(result[0].idUser, result[0].idGroupUserUser,
          result[0].idStatus, result[0].createdAt, result[0].updatedAt);
        groupusers.push(groupuser);
      }
      return callback(null, groupusers);
    }
  });
};

module.exports = GroupUser;