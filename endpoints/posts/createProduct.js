
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");



router.post(
	"/createProduct",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "category" in params && "name" in params && "price" in params && "categoryEng" in params && "nameEng" in params) {
			if (typeof params["email"] == "string" && typeof params["password"] == "string" && typeof params["category"] == "string" && typeof params["name"] == "string" && typeof params["price"] == "number" && typeof params["categoryEng"] == "string" && typeof params["nameEng"] == "string") {
				pool.query(
					"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'",
					function(error, rows, fields) {
						if (!error) {
							if (rows.length > 0) {
								if (rows[0]["isemployee"] == 1) {
									pool.query(
										"INSERT INTO product(ProductID, Category, Name, InStock, Price, CategoryEng, NameEng) SELECT MAX(ProductID)+1, '" + params["category"] + "', '" + params["name"] + "', 1, " + params["price"] + ", '" + params["categoryEng"] + "', '" + params["nameEng"] + "' FROM product;",
										function(errorA, rowsA, fieldsA) {
											if (!errorA) {
												response.status(200);
												response.end();
											} else {
												// product insert error
												response.status(500).send("API failed to execute correctly");
											}
										}
									);
								} else {
									// Not an employee
									response.status(401).send("Not allowed to create product");
								}
							} else {
								// Account not found
								response.status(404).send("Incorrect Email or Password");
							}
						} else {
							// account select error
							response.status(500).send("API failed to execute correctly");
						}
					}
				);
			} else {
				// invalid parameter types
				response.status(400).send("Unable to handle request");
			}
		} else {
			// missing parameters
			response.status(400).send("Unable to handle request");
		}
	}
);

module.exports = router;
