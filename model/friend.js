// Friend class
var idUser, _user, idFriend, _friend, idStatus, _status, createdAt, updatedAt;
var Access = require("./simple_table");
var User = require("./user");
var Status = require("./status");

// constructor
function Friend(idUser, idFriend, idStatus, createdAt, updatedAt) {
  if (idUser == null || idFriend == null || idStatus == null) {
    throw("Friend: invalid input");
  }
  
  this.idUser = idUser;
  this._user = null;
  this.idFriend = idFriend;
  this._friend = null;
  this.idStatus = idStatus;
  this._status = null;
  this.createdAt = createdAt;
  this.updatedAt = updatedAt;
}

// save to db
Friend.prototype.save = function(callback) {
  var local = this;

  var post = {
    idUser: local.idUser,
    idFriendUser: local.idFriend,
    idStatus: local.idStatus
  };
  
  if (local.id == null) {
    post.createdAt = null;
    post.updatedAt = null;
    
    insertFriend(post, function(id) {
      return callback(id);
    });
  } else {
    updateFriend(local.idUser, local.idFriend, post, callback);
  }
};

function insertFriend(post, callback) {
  var query = db.query("INSERT INTO friend SET ?", post, function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log("Inserted ID " + result.insertId + " into Friend");
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateFriend(idUser, idFriend, post, callback) {
  var query = db.query("UPDATE friend SET ? WHERE idUser = ? AND idFriendUser = ?",
    [post, idUser, idFriend], function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log("Updated Friend with idUser: " + idUser + " and idFriend: " + idFriend);
    }
    return callback();
  });
  console.log(query.sql);
}

// GET: user
Object.defineProperty(Friend.prototype, "user", {
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

// GET: friend
Object.defineProperty(Friend.prototype, "friend", {
  set: function() {
    var local = this;
    if (local._friend == null) {
      User.getUserById(local.idFriend, function(friend) {
        local._friend = friend;
        callback(local._friend);
      });
    } else {
      callback(local._friend);
    }
  }
});

// GET: status
Object.defineProperty(Friend.prototype, "status", {
  set: function() {
    var local = this;
    if (local._status == null) {
      Status.getStatusById(local.idFriend, function(status) {
        local._status = status;
        callback(local._status);
      });
    } else {
      callback(local._status);
    }
  }
});

Friend.getFriendById = function(idUser, idFriend, callback) {
  var query = "SELECT * FROM friend WHERE idUser = " + idUser + " AND idFriendUser = " +
                idFriend + ";";
  db.query(query, function(err, result) {
    if (err) {
      console.log(query);
      console.log(err.message);
      return callback(err);
    } else if (result.length === 0) {
      return callback(new Error("No Friend with idUser " + idUser + " and idFriend " +
                      idFriend));
    } else {
      var friend = new Friend(result[0].idUser, result[0].idFriendUser,
        result[0].idStatus, result[0].createdAt, result[0].updatedAt);
      return callback(null, friend);
    }
  });
};

Friend.getFriendsByUser = function(idUser, callback) {
  Access.selectByColumn("friend", "idUser", idUser, "", function(result) {
    if (result != null) {
      var friends = [];
      for (var i = 0; i < result.length; i++) {
        var friend = new Friend(result[0].idUser, result[0].idFriendUser,
          result[0].idStatus, result[0].createdAt, result[0].updatedAt);
        friends.push(friend);
      }
      return callback(null, friends);
    } else {
      return callback(new Error("No Friends for idUser " + idUser));
    }
  });
};

Friend.getFriendsByFriendUser = function(idFriend, callback) {
  Access.selectByColumn("friend", "idFriendUser", idFriend, "", function(result) {
    if (result != null) {
      var friends = [];
      for (var i = 0; i < result.length; i++) {
        var friend = new Friend(result[0].idUser, result[0].idFriendUser,
          result[0].idStatus, result[0].createdAt, result[0].updatedAt);
        friends.push(friend);
      }
      return callback(null, friends);
    } else {
      return callback(new Error("No Friends for idFriendUser " + idFriendUser));
    }
  });
};

Friend.getFriendsByFriendStatus = function(idUser, idStatus, callback) {
  var query = "SELECT * FROM friend WHERE idUser = " + idUser + " AND idStatus = " +
                idStatus + ";";
  db.query(query, function(err, result) {
    if (err) {
      console.log(query);
      console.log(err.message);
      return callback(err);
    } else if (result == null) {
      return callback(new Error("No Friends for idUser " + idUser + " with idStatus " +
                      idStatus));
    } else {
      var friends = [];
      for (var i = 0; i < result.length; i++) {
        var friend = new Friend(result[0].idUser, result[0].idFriendUser,
          result[0].idStatus, result[0].createdAt, result[0].updatedAt);
        friends.push(friend);
      }
      return callback(null, friends);
    }
  });
};

module.exports = Friend;