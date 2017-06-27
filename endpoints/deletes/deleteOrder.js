
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.delete(
	"/deleteOrder",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "orderid" in params) {
			pool.query(
				"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'; SELECT GROUP_CONCAT(OrderID) AS Summary FROM `order` WHERE Email = '" + params["email"] + "'",
				function(error, rows, fields) {
					if (!error) {
						// Check if at least one log-in result was found and the person whose orders is being looked up has orders
						console.log(rows[1][0]["Summary"]);
						console.log(rows[0]);
						if (rows[0].length > 0 || rows[1][0]["Summary"] != null) {
							var allowedToDelete = false;
							// Log-in is employee
							if (rows[0].length > 0) {
								if (rows[0][0]["isemployee"] == true) {
									allowedToDelete = true;
								}
							}
							// Log-in is person who made the original order
							var numberString = rows[1][0]["Summary"];
							var numbers = numberString.split(",");
							var result = numbers.some(n => n == params["orderid"]);
							if (result) {
								allowedToDelete = true;
							}
							if (allowedToDelete) {
								pool.query(
									"DELETE FROM `order` WHERE OrderID = " + params["orderid"] + ";",
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
								// API failure
								response.status(401).send("Unauthorised");
							}
						} else {
							// no results
							response.status(404).send("Order not found");
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
