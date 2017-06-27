
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.delete(
	"/clearUnhandledOrders",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params) {
			pool.query(
				"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "';",
				function(error, rows, fields) {
					if (!error) {
						// Check if log-in was found and if that person is an employee
						if (rows.length > 0) {
							if (rows[0]["isemployee"] == true) {
								// "DELETE FROM `order` WHERE `order`.Handled = 0;"
								pool.query(
									"DELETE FROM `order` WHERE `order`.Handled = 0;",
									function(errorA, rowsA, fieldsA) {
										if (!errorA) {
											response.status(200);
											response.end();
										} else {
											// API failure
											response.status(500).send("API failed to execute correctly");
										}
									}
								);
							} else {
								// Not employee, unauthorized
								response.status(401).send("Unauthorised");
							}
						} else {
							// Incorrect log-in
							response.status(404).send("Log-in not found");
						}
					} else {
						// API failure
						response.status(500).send("API failed to execute correctly");
					}
				}
			);
		} else {
			response.status(400).send("Unable to handle request");
			response.end();
		}
	}
);

module.exports = router;
