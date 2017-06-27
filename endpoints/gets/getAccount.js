
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.get(
	"/getAccount",
	function(request, response, next) {
		var params = require("url").parse(request.url, true).query;
		if ("email" in params && "password" in params) {
			// Generate sql based on parameters
			var usersSQL = "SELECT * FROM account WHERE Email = '" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "';";
			pool.query(
				usersSQL,
				function(error, rows, fields) {
					if (!error) {
						if (rows.length > 0) {
							// Return requested account
							response.status(200);
							response.json(rows[0]);
						} else {
							// Account not found, return error
							response.status(404).send("Account not found");
						}
					} else {
						// Unexpected error
						response.status(500).send("API failed to execute correctly");
					}
					response.end();
				}
			);
		} else {
			response.status(404).send("Account not found");
			response.end();
		}
	}
);

module.exports = router;
