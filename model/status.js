// Status class
var id, status;
var Access = require("./simple_table");

// constructor
function Status(id, status) {
  if (status == null) {
    throw("Status: invalid input");
  }
  
  this.id = id;
  this.status = status;
}

// save to db
Status.prototype.save = function(callback) {
  var local = this;

  var post = { status: local.status };
  
  if (local.id == null) {    
    insertStatus(post, function(id) {
      local.id = id;
      return callback(id);
    });
  } else {
    updateStatus(local.id, post, callback);
  }
};

function insertStatus(post, callback) {
  var query = db.query("INSERT INTO status SET ?", post, function(err, result) {
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
  var query = db.query("UPDATE status SET ? WHERE id = ?", [post, id], function(err, result) {
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
  Access.selectByColumn("status", "idStatus", id, "", function(result) {
    if (result != null) {
      var status = new Status(result[0].idStatus, result[0].status);
      return callback(null, status);
    } else {
      return callback(new Error("No Status with ID " + id));
    }
  });
};

module.exports = Status;