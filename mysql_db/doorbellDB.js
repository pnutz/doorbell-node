module.exports.db = "CREATE DATABASE IF NOT EXISTS heroku_25e074558aecc17 DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;";
module.exports.use = "USE heroku_25e074558aecc17;";

module.exports.tables = ["CREATE TABLE IF NOT EXISTS heroku_25e074558aecc17.Status ( " +
  "idStatus INT NOT NULL AUTO_INCREMENT, " +
  "Status VARCHAR(45) NOT NULL, " +
  "PRIMARY KEY (idStatus)) " +
"ENGINE = InnoDB;",

"CREATE TABLE IF NOT EXISTS heroku_25e074558aecc17.User ( " +
  "idUser INT NOT NULL AUTO_INCREMENT, " +
  "majorUuid INT NOT NULL, " +
  "minorUuid INT NOT NULL, " +
  "username VARCHAR(60) NOT NULL, " +
  "password VARCHAR(60) NOT NULL, " +
  "email VARCHAR(60) NOT NULL, " +
  "deviceToken VARCHAR(65) NULL, " +
  "createdAt TIMESTAMP NOT NULL DEFAULT 0, " +
  "updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
  "PRIMARY KEY (idUser), " +
  "UNIQUE INDEX username_UNIQUE (username ASC), " +
  "UNIQUE INDEX email_UNIQUE (email ASC), " +
  "UNIQUE INDEX deviceToken_UNIQUE (deviceToken ASC)) " +
"ENGINE = InnoDB;",

"CREATE TABLE IF NOT EXISTS heroku_25e074558aecc17.ErrorCode ( " +
  "idErrorCode INT NOT NULL AUTO_INCREMENT, " +
  "Error VARCHAR(45) NOT NULL, " +
  "PRIMARY KEY (idErrorCode)) " +
"ENGINE = InnoDB;",

"CREATE TABLE IF NOT EXISTS heroku_25e074558aecc17.Friend ( " +
  "idFriend INT NOT NULL AUTO_INCREMENT, " +
  "idUser INT NOT NULL, " +
  "idFriendUser INT NOT NULL, " +
  "idStatus INT NOT NULL, " +
  "createdAt TIMESTAMP NOT NULL DEFAULT 0, " +
  "updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
  "PRIMARY KEY (idFriend), " +
  "INDEX idUser_idx (idUser ASC), " +
  "INDEX idFriend_idx (idFriendUser ASC), " +
  "INDEX idStatus_idx (idStatus ASC), " +
  "CONSTRAINT idUser " +
    "FOREIGN KEY (idUser) " +
    "REFERENCES heroku_25e074558aecc17.User (idUser) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION, " +
  "CONSTRAINT idFriend " +
    "FOREIGN KEY (idFriendUser) " +
    "REFERENCES heroku_25e074558aecc17.User (idUser) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION, " +
  "CONSTRAINT idStatus " +
    "FOREIGN KEY (idStatus) " +
    "REFERENCES heroku_25e074558aecc17.Status (idStatus) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION) " +
"ENGINE = InnoDB;",

"CREATE TABLE IF NOT EXISTS heroku_25e074558aecc17.Group ( " +
  "idGroup INT NOT NULL AUTO_INCREMENT, " +
  "idUser INT NOT NULL, " +
  "groupName VARCHAR(45) NOT NULL, " +
  "uuid VARCHAR(32) NOT NULL, " +
  "createdAt TIMESTAMP NOT NULL DEFAULT 0, " +
  "updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
  "PRIMARY KEY (idGroup), " +
  "INDEX idUser_idx (idUser ASC), " +
  "CONSTRAINT idUser2 " +
    "FOREIGN KEY (idUser) " +
    "REFERENCES heroku_25e074558aecc17.User (idUser) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION) " +
"ENGINE = InnoDB;",

"CREATE TABLE IF NOT EXISTS heroku_25e074558aecc17.GroupUser ( " +
  "idGroupUser INT NOT NULL AUTO_INCREMENT, " +
  "idGroup INT NOT NULL, " +
  "idUser INT NOT NULL, " +
  "idStatus INT NOT NULL, " +
  "createdAt TIMESTAMP NOT NULL DEFAULT 0, " +
  "updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
  "PRIMARY KEY (idGroupUser), " +
  "INDEX idGroup_idx (idUser ASC), " +
  "INDEX idUser_idx (idUser ASC), " +
  "INDEX idStatus_idx (idStatus ASC), " +
  "CONSTRAINT idGroup " +
    "FOREIGN KEY (idGroup) " +
    "REFERENCES heroku_25e074558aecc17.Group (idGroup) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION, " +
  "CONSTRAINT idUser3 " +
    "FOREIGN KEY (idUser) " +
    "REFERENCES heroku_25e074558aecc17.User (idUser) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION, " +
  "CONSTRAINT idStatus2 " +
    "FOREIGN KEY (idStatus) " +
    "REFERENCES heroku_25e074558aecc17.Status (idStatus) " +
    "ON DELETE NO ACTION " +
    "ON UPDATE NO ACTION) " +
"ENGINE = InnoDB;"];