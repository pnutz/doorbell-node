// ErrorCode class
var id;
var error;

var Access = require('./simple_table');

// constructor
function ErrorCode(id, error) {
  if (error == null) {
    throw ('ErrorCode: invalid input');
  }
  
  this.id = id;
  this.error = error;
}

// save to db
ErrorCode.prototype.save = function(callback) {
  var local = this;

  var post = { error: local.error };
  
  if (local.id == null) {    
    insertErrorCode(post, function(id) {
      local.id = id;
      return callback(id);
    });
  } else {
    updateErrorCode(local.id, post, callback);
  }
};

function insertErrorCode(post, callback) {
  var query = db.query('INSERT INTO errorcode SET ?', post, function(err, result) {
    if (err) {
      console.log(err.Message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log('Inserted ID ' + result.insertId + ' into ErrorCode');
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateErrorCode(id, post, callback) {
  var query = db.query('UPDATE errorcode SET ? WHERE idErrorCode = ?', [post, id], function(err, result) {
    if (err) {
      console.log(err.Message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log('Updated ErrorCode ' + id);
    }
    return callback();
  });
  console.log(query.sql);
}

ErrorCode.getErrorCodeById = function(id, callback) {
  Access.selectByColumn('errorcode', 'idErrorCode', id, '', function(err, result) {
    if (result != null) {
      var error = new ErrorCode(result[0].idErrorCode, result[0].error);
      return callback(null, error);
    } else {
      return callback(new Error('No ErrorCode with ID ' + id));
    }
  });
};

module.exports = ErrorCode;
