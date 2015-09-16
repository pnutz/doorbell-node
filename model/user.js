// User class
var id, username, password, majorUuid, minorUuid, email, deviceToken, createdAt, updatedAt;
var Access = require("./simple_table");

// constructor
function User(id, username, password, majorUuid, minorUuid, email, deviceToken, createdAt, updatedAt) {
  if (username == null || password == null ||
      majorUuid == null ||minorUuid == null || email == null) {
    throw("User: invalid input");
  }  
  this.id = id;
  this.username = username;
  this.password = password;
  this.majorUuid = majorUuid;
  this.minorUuid = minorUuid;
  this.email = email;
  this.deviceToken = deviceToken;
  this.createdAt = createdAt;
  this.updatedAt = updatedAt;
}

// save to db
User.prototype.save = function(callback) {
  var local = this;

  var post = {
    username: local.username,
    password: local.password,
    majorUuid: local.majorUuid,
    minorUuid: local.minorUuid,
    email: local.email,
    deviceToken: local.deviceToken
  };
  
  if (local.id == null) {
    post.createdAt = null;
    post.updatedAt = null;

    insertUser(post, function(id) {
      local.id = id;
      return callback(local.id);
    });
  } else {
    updateUser(local.id, post, callback);
  }
};

function insertUser(post, callback) {
  var query = db.query("INSERT INTO user SET ?", post, function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log("Inserted ID " + result.insertId + " into User");
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateUser(id, post, callback) {
  var query = db.query("UPDATE user SET ? WHERE idUser = ?", [post, id], function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log("Updated User " + id);
    }
    return callback();
  });
  console.log(query.sql);
}

User.getUserById = function(id, callback) {
  Access.selectByColumn("user", "idUser", id, "", function(err, result) {
    if (result != null) {
      var user = new User(result[0].idUser, result[0].username,
        result[0].password, result[0].majorUuid,
        result[0].minorUuid, result[0].email, result[0].deviceToken,
        result[0].createdAt, result[0].updatedAt);
      return callback(null, user);
    } else {
      return callback(new Error("No User with ID " + id));
    }
  });
};

User.getUserByUsername = function(username, callback) {
  Access.selectByColumn("user", "username", username, "", function(err, result) {
    if (err) {
      return callback(new Error("Error looking for user" + username));
    }
    if (result != null) {
      var user = new User(result[0].idUser, result[0].username,
        result[0].password, result[0].majorUuid,
        result[0].minorUuid, result[0].email, result[0].deviceToken,
        result[0].createdAt, result[0].updatedAt);
      return callback(null, user);
    } else {
      return callback(new Error("No User with username " + username));
    }
  });
};

User.getUserByEmail = function(email, callback) {
  Access.selectByColumn("user", "email", email, "", function(err, result) {
    if (result != null) {
      var user = new User(result[0].idUser, result[0].username,
        result[0].password, result[0].majorUuid,
        result[0].minorUuid, result[0].email, result[0].deviceToken,
        result[0].createdAt, result[0].updatedAt);
      return callback(null, user);
    } else {
      return callback(new Error("No User with email " + email));
    }
  });
};

User.getUserByUuid = function(majorUuid, minorUuid, callback) {
  var query = "SELECT * FROM user WHERE majorUuid = " + majorUuid + " AND minorUuid = " +
                minorUuid + ";";
    db.query(query, function(err, result) {
      if (err) {
        console.log(query);
        console.log(err.message);
        return callback(err);
      } else if (result.length === 0) {
        return callback(new Error("No User with majorUuid " + majorUuid + " and minorUuid " +
                        minorUuid));
      } else {
        var user = new User(result[0].idUser, result[0].username,
          result[0].password, result[0].majorUuid,
          result[0].minorUuid, result[0].email, result[0].deviceToken,
          result[0].createdAt, result[0].updatedAt);
        return callback(null, user);
      }
    });
};

module.exports = User;
