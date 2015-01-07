// Status class
var id, status;
var Access = require("./simple_table");

// constructor
function Status(id, Status, createdAt, updatedAt) {
  if (Status == null) {
    throw("Status: invalid input");
  }
  
  this.id = id;
  this.status = status;
  this.createdAt = createdAt;
  this.updatedAt = updatedAt;
}

// save to db
Status.prototype.save = function(callback) {
  var local = this;

  var post = { status: local.status };
  
  if (local.id == null) {
    post.createdAt = null;
    post.updatedAt = null;
    
    insertStatus(post, function(id) {
      local.id = id;
      return callback(id);
    });
  } else {
    updateStatus(local.id, post, callback);
  }
};

function insertStatus(post, callback) {
  var query = db.query("INSERT INTO Status SET ?", post, function(err, result) {
    if (err) {
      console.log(err.Message);
      db.rollback(function() {
        throw err;
      });
      return callback(null);
    } else {
      console.log("Inserted ID " + result.insertId + " into Status");
      return callback(result.insertId);
    }
  });
  console.log(query.sql);
}

function updateStatus(id, post, callback) {
  var query = db.query("UPDATE Status SET ? WHERE id = ?", [post, id], function(err, result) {
    if (err) {
      console.log(err.Message);
      db.rollback(function() {
        throw err;
      });
    } else {
      console.log("Updated Status " + id);
    }
    return callback();
  });
  console.log(query.sql);
}

Status.getStatusById = function(id, callback) {
  Access.selectByColumn("Status", "idStatus", id, "", function(result) {
    if (result != null) {
      var Status = new Status(result[0].idStatus, result[0].status,
        result[0].createdAt, result[0].updatedAt);
      return callback(null, Status);
    } else {
      return callback(new Error("No Status with ID " + id));
    }
  });
};

module.exports = Status;