
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.put(
	"/changeProductPrice",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "productid" in params && "set" in params) {
			// Check if requested person is an employee
			if (typeof params["set"] == "number") {
				if (params["set"] >= 50) { // Price must be bigger than 50 cents
					pool.query(
						"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'",
						function(error, rows, fields) {
							if (!error) {
								if (rows.length > 0) {
									if (rows[0]["isemployee"] == 1) {
										var updateSQL = "UPDATE product SET Price = " + params["set"] + " WHERE ProductID = " + params["productid"] + ";";
										//console.log(updateSQL);
										pool.query(
											updateSQL,
											function(errorA, rowsA, fieldsA) {
												if (!errorA) {
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
										response.status(401).send("Not allowed to change stock");
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
		} else {
			response.status(400).send("Unable to handle request");
			response.end();
		}
	}
);

module.exports = router;
