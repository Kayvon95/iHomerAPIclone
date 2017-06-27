
var mysql = require("mysql");

var connectionPool = mysql.createPool(
	{
		//"connectionLimit": 25, // Number of connections that can be handled at once
		"multipleStatements": true,
		"host": "eu-cdbr-west-01.cleardb.com",
		"user": "b6a54c633ef2fa",
		"password": "85c85820",
		"database": "heroku_0154efcd34e7162"
	}
);

// Other (visual) database:
/*
var connectionPool = mysql.createPool(
	{
		//"connectionLimit": 25, // Number of connections that can be handled at once
		"multipleStatements": true,
		"host": "web0094.zxcs.nl",
		"user": "u5653p3680_groep2",
		"password": "groep2password",
		"database": "u5653p3680_bestelapp"
	}
);
*/
connectionPool.getConnection(
	function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("Database connected");
		}
	}
);

module.exports = connectionPool;
