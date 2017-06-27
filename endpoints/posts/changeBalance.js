
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

// TO DO: This post request might not close correctly if wrong info is entered (database error, wrong parameters etc.)

router.post(
	"/changeBalance",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "balance" in params && "password" in params) {
			// Check for correct log-in
			pool.query(
				"SELECT Balance FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'",
				function(error, rows, fields) {
					if (rows.length > 0) {
						if (rows[0]["Balance"] + params["balance"] >= 0) {
							// Add balance
							pool.query(
								"UPDATE Account SET Balance = Balance + " + params["balance"] + " WHERE Email = '" + params["email"] + "';",
								function(error, rows, fields) {
									if (!error) {
										response.status(200);
										response.end();
									} else {
										response.status(500).send("Error during balance change");
									}
								}
							);
						} else {
							response.status(422).send("Cannot have negative balance");
						}
					} else {
						response.status(401).send("Incorrect log-in");
					}
				}
			);
		} else {
			response.status(401).send("Incorrect log-in");
		}
	}
);

module.exports = router;
