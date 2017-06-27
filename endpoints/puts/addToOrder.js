
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.put(
	"/addToOrder",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "orderid" in params && "products" in params) {
			if (typeof params["email"] == "string" && typeof params["password"] == "string" && typeof params["orderid"] == "number") {
				pool.query(
					"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'; SELECT GROUP_CONCAT(OrderID) AS Summary FROM `order` WHERE Email = '" + params["email"] + "'",
					function(error, rows, fields) {
						if (!error) {
							// Check if at least one log-in result was found and the person whose orders is being looked up has orders
							//console.log(rows[1][0]["Summary"]);
							//console.log(rows[0]);
							if (rows[0].length > 0 || rows[1][0]["Summary"] != null) {
								var allowedToAdd = false;
								// Log-in is employee
								if (rows[0].length > 0) {
									if (rows[0][0]["isemployee"] == true) {
										allowedToAdd = true;
									}
								}
								// Log-in is person who made the original order
								var numberString = rows[1][0]["Summary"];
								var numbers = numberString.split(",");
								var result = numbers.some(n => n == params["orderid"]);
								if (result) {
									allowedToAdd = true;
								}
								if (allowedToAdd) {
									// Check if products is structured correctly
									var validStructure = true;
									var didLoop = false;
									for (k in params["products"]) {
										if (params["products"].hasOwnProperty(k)) {
											didLoop = true;
											if ("Quantity" in params["products"][k] && "ProductID" in params["products"][k]) {
												// Check if types are valid
												if (typeof(params["products"][k]["Quantity"]) != "number" || typeof(params["products"][k]["ProductID"]) != "number") {
													validStructure = false;
												} else {
													// Check if numbers are valid
													if (params["products"][k]["Quantity"] <= 0 || params["products"][k]["ProductID"] <= 0) {
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
										// Check if order exists
										pool.query(
											"SELECT OrderID FROM `order` WHERE OrderID = " + params["orderid"] + ";", // TO ADD: CHECK IF ORDER ISN'T HANDLED
											function(errorA, rowsA, fieldsA) {
												if (!errorA) {
													if (rowsA.length > 0) {
														// Build SQL to get total price of products
														var priceSQL = "SELECT SUM(";
														var firstLoop = true;
														for (k in params["products"]) {
															if (firstLoop) {
																firstLoop = false;
															} else {
																priceSQL +="+";
															}
															priceSQL += params["products"][k]["Quantity"] + "*(SELECT Price FROM product WHERE ProductID = " + params["products"][k]["ProductID"] + ")";
														}
														priceSQL += ") AS TotalPrice;";
														// Execute SQL to get total price
														pool.query(
															priceSQL,
															function(errorB, rowsB, fieldsB) {
																if (!errorB) {
																	if (rowsB.length > 0) {
																		// Remember price
																		var price = rowsB[0]["TotalPrice"];
																		var selectSQL = "";
																		for (k in params["products"]) {
																			selectSQL += "SELECT COALESCE((SELECT Quantity FROM orderitem WHERE OrderID = " + params["orderid"] + " AND ProductID = " + params["products"][k]["ProductID"] + "), 0) AS Quantity;";
																		}
																		pool.query(
																			selectSQL,
																			function(errorC, rowsC, fieldsC) {
																				if (!errorC) {
																					var insertSQL = "";
																					//console.log(rowsC);
																					for (k in rowsC) {
																						//console.log(rowsC);
																						//console.log(rowsC[k]);
																						if (rowsC[k]["Quantity"] > 0) {
																							insertSQL += "UPDATE `orderitem` SET Quantity = Quantity + " + params["products"][k]["Quantity"] + ", Cost = Cost + " + params["products"][k]["Quantity"] + "*(SELECT product.Price FROM product WHERE product.ProductID = " + params["products"][k]["ProductID"] + ") WHERE ProductID = " + params["products"][k]["ProductID"] + " AND OrderID = " + params["orderid"] + ";";
																						} else {
																							insertSQL += "INSERT INTO `orderitem`(OrderItemID, OrderID, ProductID, Quantity, Cost) SELECT MAX(OrderItemID)+1, " + params["orderid"] + ", " + params["products"][k]["ProductID"] + ", " + params["products"][k]["Quantity"] + ", " + params["products"][k]["Quantity"] + "*(SELECT product.Price FROM product WHERE product.ProductID = " + params["products"][k]["ProductID"] + ") FROM `orderitem`;";
																						}
																					}
																					pool.query(
																						insertSQL,
																						function(errorD, rowsD, fieldsD) {
																							if (!errorD) {
																								pool.query(
																									"UPDATE `order` SET TotalPrice = TotalPrice + " + price + " WHERE OrderID = " + params["orderid"] + ";",
																									function(errorE, rowsE, fieldsE) {
																										if (!errorE) {
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
																								response.status(500).send("API failed to execute correctly");
																							}
																						}
																					);
																				} else {
																					// API failure
																					response.status(500).send("API failed to execute correctly");
																				}
																			}
																		);
																	} else {
																		// API failure
																		response.status(500).send("API failed to execute correctly");
																	}
																} else {
																	// API failure
																	response.status(500).send("API failed to execute correctly");
																}
															}
														);
													} else {
														// Order not found
														response.status(404).send("Order not found");
													}
												} else {
													// API failure
													response.status(500).send("API failed to execute correctly");
												}
											}
										);
									} else {
										// invalid params
										response.status(400).send("Invalid request");
									}
								} else {
									// unauthorised
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
				response.status(400).send("Invalid request");
			}
		} else {
			// missing params
			response.status(400).send("Invalid request");
		}
	}
);

module.exports = router;
