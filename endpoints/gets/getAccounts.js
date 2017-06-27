
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.get(
	"/getAccounts",
	function(request, response, next) {
		var params = require("url").parse(request.url, true).query;
		if ("API_KEY" in params && params["API_KEY"] == "yV5r6fNT0k") {
			// Generate sql based on parameters
			var usersSQL = "";
			if ("email" in params) {
				usersSQL = "SELECT * FROM account WHERE Email = '" + params["email"] + "';";
			} else {
				usersSQL = "SELECT * FROM account;";
			}
			pool.query(
				usersSQL,
				function(error, rows, fields) {
					if (!error) {
						if ("email" in params) {
							if (rows.length > 0) {
								// Return requested account
								response.status(200);
								response.json(rows[0]);
							} else {
								// Account not found, return error
								response.status(404).send("Requested user was not found");
							}
						} else {
							// Return all accounts
							response.status(200);
							response.json(rows);
						}
					} else {
						// Unexpected error
						response.status(404).send("API failed to execute correctly");
					}
					response.end();
				}
			);
		} else {
			response.status(401).send("Not allowed to get accounts");
			response.end();
		}
	}
);

module.exports = router;
