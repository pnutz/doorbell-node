// static simple_table class

// helper function: runs callback on selected rows, null if no rows selected
function selectByColumn(table, column, id, queryadd, callback) {
  var statement;
  if (column.substring(0, 2) !== 'id') {
    statement = 'SELECT * FROM ' + table + ' WHERE ' + column + ' = \'' + id + '\'';
  } else {
    statement = 'SELECT * FROM ' + table + ' WHERE ' + column + ' = ' + id;
  }

  var query = db.query(statement + ' ' + queryadd, callback);
}

/**
 * @brief Weird function name, allows us to specify which columns to be returned
 */
function selectColumnsByColumn(table, column, returnColumns, id, queryadd, callback) {
  console.log("selectColumnByColumn");
  var statement;
  // Create a string from the desired columns
  var arrayLen = returnColumns.length;
  // If empty list assume all otherwise use first item
  var selectString = arrayLen > 0 ? '*' : returnColumns[0];
  for (var count = 1; count < arrayLen; ++count)
    selectString += ',' + returnColumns[count];

  if (column.substring(0, 2) !== 'id') {
    statement = 'SELECT ' + selectString + ' FROM ' + table + ' WHERE ' + column + ' = \'' + id + '\'';
  } else {
    statement = 'SELECT ' + selectString + ' FROM ' + table + ' WHERE ' + column + ' = ' + id;
  }

  var query = db.query(statement + ' ' + queryadd, function(err, rows) {
    if (err) {
      console.log(err.message);
    }

    if (rows.length === 0)
      console.log("No Results for " + statement);

    return callback(err, rows);
  });
}

/**
 * @brief Return specific rows based on column values
 */
function selectRowsByColumnValues(sTable, sColumn, aValues, sQueryAdd, fnCallback) {
  var iArrayLen = aValues.length;
  if (iArrayLen <= 0)
    return fnCallback({err : "No column values provided"});
  var sStatement;
  // Create a string from the desired columns
  // If empty list assume all otherwise use first item
  var sSelectString = aValues[0];
  for (var count = 1; count < iArrayLen; ++count)
    sSelectString += ',' + aValues[count];

  sStatement = 'SELECT * FROM ' + sTable + ' WHERE ' + sColumn + ' IN (' + sSelectString + ')';

  var query = db.query(sStatement + ' ' + sQueryAdd, function(err, rows) {
    if (err) {
      console.log(err.message);
    }

    if (rows.length !== 0) {
      return fnCallback(err, rows);
    } else {
      console.log('No rows selected');
      return fnCallback(null);
    }
  });
  console.log(query.sql);
}


// DEPRECATED, id column isn't always id
// returns value of object in db with id. returns null if it does not exist
/*function getValueById(table, column, id, callback) {
  var query = db.query('SELECT * FROM ' + table + ' WHERE id = ' + id, function(err, rows) {
    if (err) {
      console.log(err.message);
    }

    if (rows.length != 0) {
      var result = rows[0];
      console.log(result);
      return callback(result[column]);
    } else {
      console.log('No rows selected');
      return callback(null);
    }
  });
  console.log(query.sql);
};*/

// returns id of object in db with value. returns null if it does not exist
function getIdByValue(table, column, value, callback) {
  var statement;
  if (column.substring(0, 2) !== 'id') {
    statement = 'SELECT * FROM ' + table + ' WHERE ' + column + ' = \'' + value + '\'';
  } else {
    statement = 'SELECT * FROM ' + table + ' WHERE ' + column + ' = ' + value;
  }

  var query = db.query(statement, function(err, rows) {
    if (err) {
      console.log(err.message);
    }

    if (rows.length !== 0) {
      var result = rows[0];
      console.log(result);
      return callback(result.id);
    } else {
      console.log('No rows selected');
      return callback(null);
    }
  });
  console.log(query.sql);
};

// saves object with value in db and returns id
function save(table, column, value, callback) {
  // check if object with value already exists
  getIdByValue(table, column, value, function(resultId) {
    if (resultId == null) {
      var post = {};
      post[column] = value;

      var query = db.query('INSERT INTO ' + table + ' SET ?', post, function(err, result) {
        if (err) {
          db.rollback(function() {
            if (err) {
              console.log(err.message);
            }
          });
          return callback(err);
        } else {
          console.log('Inserted ID ' + result.insertId + ' into ' + table);
          return callback(err, result.insertId);
        }
      });
      console.log(query.sql);
    } else {
      return callback(err, resultId);
    }
  });
};

module.exports = {
  selectByColumn: selectByColumn,
  //getValueById: getValueById,
  getIdByValue: getIdByValue,
  selectColumnsByColumn: selectColumnsByColumn,
  selectRowsByColumnValues: selectRowsByColumnValues,
  save: save,
};
