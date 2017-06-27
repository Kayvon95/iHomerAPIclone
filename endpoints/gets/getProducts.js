
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.get(
	"/getProducts",
	function(request, response, next) {
		var params = require("url").parse(request.url, true).query;
		// Generate sql based on parameters
		var productsSQL = "";
		if ("category" in params) {
			productsSQL = "SELECT * FROM product WHERE Category = '" + params["category"] + "' OR CategoryEng = '" + params["category"] + "';";
		} else {
			productsSQL = "SELECT * FROM product;";
		}
		pool.query(
			productsSQL,
			function(error, rows, fields) {
				if (!error) {
					// Return requested products
					response.status(200);
					response.json(rows);
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
