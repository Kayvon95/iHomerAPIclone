
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.get(
	"/getProductCategories",
	function(request, response, next) {
		pool.query(
			"SELECT DISTINCT Category FROM product;",
			function(error, rows, fields) {
				if (!error) {
					// Return all categories
					response.status(200);
					var categoriesArray = [];
					for (var i = 0; i < rows.length; i++) {
						categoriesArray[i] = rows[i]["Category"];
					}
					response.json(categoriesArray);
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