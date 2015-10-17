// User class
var id;
var username;
var password;
var majorUuid;
var minorUuid;
var email;
var deviceToken;
var createdAt;
var updatedAt;

var Access = require('./simple_table');
var async = require('async');

// constructor
function User(id, username, password, majorUuid, minorUuid, email, deviceToken, createdAt, updatedAt) {
  if (username == null || password == null ||
      majorUuid == null || minorUuid == null || email == null) {
    throw ('User: invalid input');
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

function ConvertDbResultToUser(mResult)
{
  return new User(mResult.idUser, mResult.username,
    mResult.password, mResult.majorUuid,
    mResult.minorUuid, mResult.email, mResult.deviceToken,
    mResult.createdAt, mResult.updatedAt);
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
    deviceToken: local.deviceToken,
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
  var query = db.query('INSERT INTO user SET ?', post, function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log('Inserted ID ' + result.insertId + ' into User');
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateUser(id, post, callback) {
  var query = db.query('UPDATE user SET ? WHERE idUser = ?', [post, id], function(err, result) {
    if (err) {
      console.log(err.message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log('Updated User ' + id);
    }
    return callback();
  });
  console.log(query.sql);
}

function getUserBy(sColumn, value, callback) {
  Access.selectByColumn('user', sColumn, value, '', function(err, result) {
    if (err) {
      return callback(new Error('Error looking for ' + sColumn + ' ' + value));
    }

    if (result) {
      console.log(result);
      user = ConvertDbResultToUser(result[0]);
    } else {
      err = new Error('No User with ' + sColumn + ' ' + value);
    }
    return callback(err, user);
  });
};

User.getUserById = function(id, callback) {
    return getUserBy("idUser", id, callback);
};

User.getUserByUsername = function(username, callback) {
    return getUserBy("username", username, callback);
};

User.getUserByEmail = function(email, callback) {
    return getUserBy("email", email, callback);
};

User.getUserByUuid = function(majorUuid, minorUuid, callback) {
  var query = 'SELECT * FROM user WHERE majorUuid = ' + majorUuid + ' AND minorUuid = ' +
                minorUuid + ';';
    db.query(query, function(err, result) {
      if (err) {
        console.log(query);
        console.log(err.message);
        return callback(err);
      } else if (result.length === 0) {
        return callback(new Error('No User with majorUuid ' + majorUuid + ' and minorUuid ' +
                        minorUuid));
      } else {
        var user = ConvertDbResultToUser(result[0]);
        return callback(null, user);
      }
    });
};

module.exports = User;
