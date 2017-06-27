
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.delete(
	"/removeFromOrder",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "password" in params && "orderid" in params && "products" in params) {
			pool.query(
				"SELECT isemployee FROM account WHERE Email='" + params["email"] + "' AND `Password` = BINARY '" + params["password"] + "'; SELECT GROUP_CONCAT(OrderID) AS Summary FROM `order` WHERE Email = '" + params["email"] + "'",
				function(error, rows, fields) {
					if (!error) {
						// Check if at least one log-in result was found and the person whose orders is being looked up has orders
						//console.log(rows[1][0]["Summary"]);
						//console.log(rows[0]);
						if (rows[0].length > 0 || rows[1][0]["Summary"] != null) {
							var allowedToRemove = false;
							// Log-in is employee
							if (rows[0].length > 0) {
								if (rows[0][0]["isemployee"] == true) {
									allowedToRemove = true;
								}
							}
							// Log-in is person who made the original order
							var numberString = rows[1][0]["Summary"];
							var numbers = numberString.split(",");
							var result = numbers.some(n => n == params["orderid"]);
							if (result) {
								allowedToRemove = true;
							}
							if (allowedToRemove) {
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
										"SELECT OrderID FROM `order` WHERE OrderID = " + params["orderid"] + " AND Handled = 0;", // TO ADD: CHECK IF ORDER ISN'T HANDLED
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
																		//selectSQL += "SELECT COALESCE((SELECT Quantity FROM orderitem WHERE OrderID = " + params["orderid"] + " AND ProductID = " + params["products"][k]["ProductID"] + "), 0) AS Quantity, OrderItemID FROM orderitem;";
																		selectSQL += "SELECT COALESCE((SELECT Quantity FROM orderitem WHERE OrderID = " + params["orderid"] + " AND ProductID = " + params["products"][k]["ProductID"] + "), 0) AS Quantity, OrderItemID FROM orderitem WHERE OrderID = " + params["orderid"] + " AND ProductID = " + params["products"][k]["ProductID"] + ";";
																	}
																	pool.query(
																		selectSQL,
																		function(errorC, rowsC, fieldsC) {
																			if (!errorC) {
																				var removeSQL = "";
																				//console.log(rowsC);
																				var continueDeletion = true;
																				for (k in rowsC) {
																					if (rowsC[k]["Quantity"]-params["products"][k]["Quantity"] >= 0) {
																						if (rowsC[k]["Quantity"]-params["products"][k]["Quantity"] > 0) {
																							removeSQL += "UPDATE `orderitem` SET Quantity = Quantity - " + params["products"][k]["Quantity"] + ", Cost = Cost - " + params["products"][k]["Quantity"] + "*(SELECT product.Price FROM product WHERE product.ProductID = " + params["products"][k]["ProductID"] + ") WHERE ProductID = " + params["products"][k]["ProductID"] + " AND OrderID = " + params["orderid"] + ";";
																						} else {
																							removeSQL += "DELETE FROM `orderitem` WHERE OrderItemID = " + rowsC[k]["OrderItemID"] + ";";
																						}
																					} else {
																						continueDeletion = false;
																					}
																				}
																				if (continueDeletion) {
																					pool.query(
																						removeSQL,
																						function(errorD, rowsD, fieldsD) {
																							if (!errorD) {
																								pool.query(
																									"UPDATE `order` SET TotalPrice = TotalPrice - " + price + " WHERE OrderID = " + params["orderid"] + ";",
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
																					// Trying to delete too many products
																					response.status(400).send("Invalid Quantity count");
																				}
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
			// missing params
			response.status(400).send("Invalid request");
		}
	}
);

module.exports = router;
