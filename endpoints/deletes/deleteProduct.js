
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.delete(
	"/deleteProduct",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && ("productID" in params || "productName" in params)) {
			if (typeof params["email"] == "string" && typeof params["password"] == "string" && (typeof params["productID"] == "number" || typeof params["productName"] == "string")) {
				pool.query(
					"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "';",
					function(error, rows, fields) {
						if (!error) {
							if (rows.length > 0) {
								if (rows[0]["isemployee"] == 1) {
									var deleteSQL = "";
									if ("productID" in params) {
										deleteSQL = "DELETE FROM `product` WHERE ProductID = " + params["productID"] + ";";
									} else {
										deleteSQL = "DELETE FROM `product` WHERE Name = '" + params["productName"] + "' OR NameEng = '" + params["productName"] + "';";
									}
									pool.query(
										deleteSQL,
										function(errorA, rowsA, fieldsA) {
											if (!errorA) {
												response.status(200);
												response.end();
											} else {
												// API failure
												response.status(500).send("API failed to execute correctly 1");
											}
										}
									);
								} else {
									// Not an employee
									response.status(401).send("Not allowed to delete product");
								}
							} else {
								// Account not found
								response.status(404).send("Account not found");
							}
						} else {
							// SQL error
							response.status(500).send("API failed to execute correctly 2");
						}
					}
				);
			} else {
				// Invalid parameters
				response.status(400).send("Unable to handle request");
			}
		} else {
			// Invalid parameters
			response.status(400).send("Unable to handle request");
		}
	}
);

module.exports = router;
