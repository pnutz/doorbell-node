// Group class
var id, groupName, idUser, _user, uuid, createdAt, updatedAt;
var Access = require("./simple_table");
var User = require("./user");

// constructor
function Group(id, groupName, idUser, uuid, createdAt, updatedAt) {
  if (groupName == null || idUser == null || uuid == null) {
    throw("Group: invalid input");
  }
  
  this.id = id;
  this.groupName = groupName;
  this.categoryCode = categoryCode;
  this.idUser = idUser;
  this._user = null;
  this.uuid = uuid;
  this.createdAt = createdAt;
  this.updatedAt = updatedAt;
}

// save to db
Group.prototype.save = function(callback) {
  var local = this;

  var post = {
    groupName: local.groupName,
    idUser: local.idUser,
    uuid: local.uuid
  };
  
  if (local.id == null && uuid == null) {
    post.createdAt = null;
    post.updatedAt = null;
    
    insertGroup(post, function(id) {
      local.id = id;
      return callback(id);
    });
  } else {
    updateGroup(local.id, post, callback);
  }
};

function insertGroup(post, callback) {
  var query = db.query("INSERT INTO group SET ?", post, function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log("Inserted ID " + result.insertId + " into Group");
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateGroup(id, post, callback) {
  var query = db.query("UPDATE group SET ? WHERE id = ?", [post, id], function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log("Updated Group " + id);
    }
    return callback();
  });
  console.log(query.sql);
}

// GET: user
Object.defineProperty(Group.prototype, "user", {
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

Group.getGroupById = function(id, callback) {
  Access.selectByColumn("group", "idGroup", id, "", function(result) {
    if (result != null) {
      var group = new Group(result[0].idGroup,
        result[0].groupName, result[0].idUser,
        result[0].uuid, result[0].createdAt, result[0].updatedAt);
      return callback(null, group);
    } else {
      return callback(new Error("No Group with ID " + id));
    }
  });
};

Group.getGroupByGroupName = function(idUser, groupName, callback) {
  var query = "SELECT * FROM group WHERE groupName = '" + groupName + "' AND idUser = " +
                idUser + ";";
    db.query(query, function(err, result) {
      if (err) {
        console.log(query);
        console.log(err.message);
        return callback(err);
      } else if (result.length === 0) {
        return callback(new Error("No Group with groupName " + groupName + " for User " +
                        idUser));
      } else {
        var group = new Group(result[0].idGroup,
          result[0].groupName, result[0].idUser,
          result[0].uuid, result[0].createdAt, result[0].updatedAt);
        return callback(null, group);
      }
    });
};

Group.getGroupByUuid = function(uuid, callback) {
  Access.selectByColumn("group", "uuid", uuid, "", function(result) {
    if (result != null) {
      var group = new Group(result[0].idGroup,
        result[0].groupName, result[0].idUser,
        result[0].uuid, result[0].createdAt, result[0].updatedAt);
      return callback(null, group);
    } else {
      return callback(new Error("No Group with uuid " + uuid));
    }
  });
};

Group.getGroupsByUser = function(idUser, callback) {
  Access.selectByColumn("group", "idUser", idUser, "", function(result) {
    if (result != null) {
      var groups = [];
      for (var i = 0; i < result.length; i++) {
        var group = new Group(result[0].idGroup,
          result[0].groupName, result[0].idUser,
          result[0].uuid, result[0].createdAt, result[0].updatedAt);
        groups.push(group);
      }
      return callback(null, groups);
    } else {
      return callback(new Error("No Groups with ID " + id));
    }
  });
};

module.exports = Group;