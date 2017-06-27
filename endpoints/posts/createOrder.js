
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");



router.post(
	"/createOrder",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "order" in params) {
			// Check for correct log-in
			pool.query(
				"SELECT Email, Balance FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'",
				function(error, rows, fields) {
					if (!error) {
						// Check if at least one log-in result was found
						if (rows.length > 0) {
							// Check if request has correctly structured body
							var validStructure = true;
							var didLoop = false;
							for (k in params["order"]) {
								if (params["order"].hasOwnProperty(k)) {
									didLoop = true;
									if ("Quantity" in params["order"][k] && "ProductID" in params["order"][k]) {
										// Check if types are valid
										if (typeof(params["order"][k]["Quantity"]) != "number" || typeof(params["order"][k]["ProductID"]) != "number") {
											validStructure = false
										} else {
											// Check if numbers are valid
											if (params["order"][k]["Quantity"] <= 0 || params["order"][k]["ProductID"] <= 0) {
												validStructure = false;
											}
										}
									} else {
										validStructure = false;
									}
								}
							}
							// Final structure check
							if (validStructure && didLoop) {
								// Build SQL to get total price of order
								var priceSQL = "SELECT SUM(";
								var firstLoop = true;
								for (k in params["order"]) {
									if (firstLoop) {
										firstLoop = false;
									} else {
										priceSQL +="+";
									}
									priceSQL += params["order"][k]["Quantity"] + "*(SELECT Price FROM product WHERE ProductID = " + params["order"][k]["ProductID"] + ")";
								}
								priceSQL += ") AS TotalPrice;";
								// Execute SQL to get total price
								pool.query(
									priceSQL,
									function(errorA, rowsA, fieldsA) {
										if (!errorA) {
											if (rowsA.length > 0) {
												var price = rowsA[0]["TotalPrice"];
												if (price <= rows[0]["Balance"]) {
													// Get the currently highest OrderID and use it for the next query to create the order
													var orderSQL = "SELECT MAX(OrderID)+1 AS LatestOrderID FROM `order`; INSERT INTO `order`(OrderID, Email, Handled, TotalPrice, `Date`) SELECT MAX(OrderID)+1, '" + params["email"] + "', 0, " + price + ", NOW() FROM `order`;";
													// NOTE: SELECT MAX(OrderItemID)+1 works if you do multiple inserts after one another in the same query
													pool.query(
														orderSQL,
														function(errorB, rowsB, fieldsB) {
															if (!errorB) {
																// orderSQL executes 2 queries, so rowsB becomes an array with rows (with fields) instead of a row with fields !IMPORTANT
																var insertedOrderID = rowsB[0][0]["LatestOrderID"];
																// Build the SQL to create order items
																var itemsSQL = "";
																for (k in params["order"]) {
																	itemsSQL += "INSERT INTO `orderitem`(OrderItemID, OrderID, ProductID, Quantity, Cost) SELECT MAX(OrderItemID)+1, " + insertedOrderID + ", " + params["order"][k]["ProductID"] + ", " + params["order"][k]["Quantity"] + ", " + params["order"][k]["Quantity"] + "*(SELECT product.Price FROM product WHERE product.ProductID = " + params["order"][k]["ProductID"] + ") FROM `orderitem`; ";
																}
																pool.query(
																	itemsSQL,
																	function(errorC, rowsC, fieldsC) {
																		if (!errorC) {
																			// OrderItems were correctly created
																			response.status(200);
																			response.end();
																		} else {
																			response.status(500).send("API failed to execute correctly");
																		}
																	}
																);
															} else {
																response.status(500).send("API failed to execute correctly");
															}
														}
													);
												} else {
													response.status(412).send("Not enough money in your account");
												}
											} else {
												response.status(500).send("API failed to execute correctly");
											}
										} else {
											response.status(500).send("API failed to execute correctly");
										}
									}
								);
							} else {
								response.status(400).send("Order structured incorrectly");
							}
						} else {
							response.status(401).send("Incorrect log-in");
						}
					} else {
						response.status(500).send("API failed to execute correctly");
					}
				}
			);
		} else {
			response.status(400).send("Request formatted incorrectly");
		}
	}
);

module.exports = router;
