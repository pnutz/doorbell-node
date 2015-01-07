var mysql = require("mysql");
var async = require("async");
var script = require("./mysql_db/doorbellDB");

var db_config = {
  host: "us-cdbr-iron-east-01.cleardb.net",
  user: "baae06c4c30b89",
  password: "9b5bfc63",
  database: "heroku_06d5fed0deeebe4"
};

var connection;

function initHandleDisconnect(callback) {
  connection = mysql.createConnection(db_config);
  
  connection.connect(function(err) {
    if (err) {
      console.log('Error when connecting to DB:', err);
      setTimeout(handleDisconnect, 2000);
    }
    console.log("Connected to MySQL Database");
  });
  
  // connection lost due to server restart, connection idle timeout
  connection.on('error', function(err) {
    console.log('DB Error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
  
  global.db = connection;
  return callback();
}

function handleDisconnect() {
  connection = mysql.createConnection(db_config);
  
  connection.connect(function(err) {
    if (err) {
      console.log('Error when connecting to DB:', err);
      setTimeout(handleDisconnect, 2000);
    }
    console.log("Reconnected to MySQL Database");
  });
  
  // connection lost due to server restart, connection idle timeout
  connection.on('error', function(err) {
    console.log('DB Error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
  
  global.db = connection;
}

function connect(resultCallback) {
  async.series([
    function(callback) {
      initHandleDisconnect(callback);
    },
    function(callback) {
      var query = script.db;
      connection.query(query, function(err, result) {
        if (err) {
          console.log(query);
          throw err;
        }
        console.log("Database Created");
        return callback();
      });
    },
    function(callback) {
      var query = script.use;
      connection.query(query, function(err, result) {
        if (err) {
          console.log(query);
          throw err;
        }
        console.log("Using Database");
        return callback();
      });
    },
    function(callback) {
      async.eachSeries(script.tables, function(query, eachCallback) {
        connection.query(query, function(err, result) {
          if (err) {
            console.log(query);
            throw err;
          }
          return eachCallback();
        });
      }, function(err) {
        if (err) {
          throw err;
        }
        
        console.log("Initialized Database Tables");
        return callback();
      });
    }
  ], function(err, results) {
    if (err) {
      console.log(err.message);
    }
    
    return resultCallback();
  });
}

module.exports = {
  connect: connect
};