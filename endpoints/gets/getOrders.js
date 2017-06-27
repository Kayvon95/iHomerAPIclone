
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.get(
	"/getOrders",
	function(request, response, next) {
		var params = require("url").parse(request.url, true).query;
		// Generate sql based on parameters
		var ordersSQL = "";
		var sortSQL = "ORDER BY `order`.OrderID ASC";
		var doSort = false;
		if ("sorted" in params && (params["sorted"] == true || params["sorted"] == "true")) {
			sortSQL = "ORDER BY `order`.`Handled` ASC, `order`.OrderID DESC";
			doSort = true;
		}
		if ("email" in params && "handled" in params) {
			var handled = params["handled"] == "true" && 1 || 0;
			ordersSQL = "SELECT * FROM `order` INNER JOIN orderitem ON `order`.`OrderID` = orderitem.OrderID WHERE Email = '" + params["email"] + "' AND Handled = " + handled + " " + sortSQL + ";";
		} else if ("email" in params) {
			ordersSQL = "SELECT * FROM `order` INNER JOIN orderitem ON `order`.`OrderID` = orderitem.OrderID WHERE Email = '" + params["email"] + "' " + sortSQL + ";";
		} else if ("handled" in params) {
			var handled = params["handled"] == "true" && 1 || 0;
			ordersSQL = "SELECT * FROM `order` INNER JOIN orderitem ON `order`.`OrderID` = orderitem.OrderID WHERE Handled = " + handled + " " + sortSQL + ";";
		} else {
			ordersSQL = "SELECT * FROM `order` INNER JOIN orderitem ON `order`.`OrderID` = orderitem.OrderID " + sortSQL + ";";
		}
		pool.query(
			ordersSQL,
			function(error, rows, fields) {
				if (!error) {
					if (rows.length <= 0) {
						// Return requested error
						response.status(404).send("No orders found");
					} else {
						// Return requested orders
						var orders = [];
						for (var i = 0; i < rows.length; i++) {
							//console.log(orders[rows[i]["OrderID"]] == undefined);
							if (orders[rows[i]["OrderID"]] == undefined) {
								// Create order object
								orders[rows[i]["OrderID"]] = {
									"OrderID": rows[i]["OrderID"],
									"Email": rows[i]["Email"],
									"Handled": (rows[i]["Handled"] == 1 && true || false),
									"TotalPrice": rows[i]["TotalPrice"],
									"Date": rows[i]["Date"],
									"OrderItems": []
								};
							}

							// add OrderItem to correlating object
							orders[rows[i]["OrderID"]]["OrderItems"].push(
								{
									"ProductID": rows[i]["ProductID"],
									"Quantity": rows[i]["Quantity"],
									"Cost": rows[i]["Cost"]
								}
							);
						}
						var filteredOrders = orders.filter(function(val) { return val != null; });
						if (doSort) {
							filteredOrders.sort(
								function(itemA, itemB) {
									if (itemA["Handled"] != itemB["Handled"]) {
										if (itemA["Handled"] == true) {
											return 1;
										} else {
											return -1;
										}
									} else {
										return (itemA["Date"] < itemB["Date"]) ? 1 : (itemA["Date"] > itemB["Date"]) ? -1 : 0;
									}
								}
							);
						}
						response.status(200);
						response.json(filteredOrders);
					}
				} else {
					// Unexpected error
					response.status(404).send("API failed to execute correctly");
				}
				response.end();
			}
		);
	}
);

module.exports = router;
