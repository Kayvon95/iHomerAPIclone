
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.put(
	"/handleOrder",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "orderid" in params) {
			if (typeof params["orderid"] == "number" && typeof params["email"] == "string" && typeof params["password"] == "string") {
				// handleValue equals 1 if params["set"] exists and equals true
				var handleValue = params["set"] == true && 1 || 0;
				// Check if requested person is an employee
				pool.query(
					"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'",
					function(error, rows, fields) {
						if (!error) {
							if (rows.length > 0) {
								if (rows[0]["isemployee"] == 1) {
									// Logged in user is an employee, now handle the order
									var handleUpdate = "UPDATE `order` SET Handled = " + handleValue + " WHERE `order`.OrderID = " + params["orderid"] + ";";
									pool.query(
										handleUpdate,
										function(error, rows, fields) {
											if (!error) {
												response.status(200);
												response.end();
											} else {
												// Unexpected error
												response.status(500).send("API failed to execute correctly");
												response.end();
											}
										}
									);
								} else {
									response.status(401).send("Not allowed to handle orders");
									response.end();
								}
							} else {
								response.status(404).send("Incorrect Email or Password");
								response.end();
							}
						} else {
							// Unexpected error
							response.status(500).send("API failed to execute correctly");
							response.end();
						}
					}
				);
			} else {
				response.status(400).send("Unable to handle request");
				response.end();
			}
		} else {
			response.status(400).send("Unable to handle request");
			response.end();
		}
	}
);

module.exports = router;
