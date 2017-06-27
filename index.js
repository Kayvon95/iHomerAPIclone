
var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var mysql = require("mysql");
var schedule = require("node-schedule");


// Connect to database
var pool = require("./database/dbConnection");

var app = express();
app.use(bodyParser.json());

// GETS
app.use("/API", require("./endpoints/gets/getAccounts"));
app.use("/API", require("./endpoints/gets/getAccount"));
app.use("/API", require("./endpoints/gets/getProducts"));
app.use("/API", require("./endpoints/gets/getProductCategories"));
app.use("/API", require("./endpoints/gets/getOrders"));
app.use("/API", require("./endpoints/gets/getDeviceInfo"));

// POSTS
app.use("/API", require("./endpoints/posts/changeBalance"));
app.use("/API", require("./endpoints/posts/createOrder"));
app.use("/API", require("./endpoints/posts/createProduct"));

// PUTS
app.use("/API", require("./endpoints/puts/addToOrder"));
app.use("/API", require("./endpoints/puts/handleOrder"));
app.use("/API", require("./endpoints/puts/setProductInStock"));
app.use("/API", require("./endpoints/puts/setDeviceInfo"));
app.use("/API", require("./endpoints/puts/changeProductPrice"));

// DELETES
app.use("/API", require("./endpoints/deletes/removeFromOrder"));
app.use("/API", require("./endpoints/deletes/deleteOrder"));
app.use("/API", require("./endpoints/deletes/clearUnhandledOrders"));
app.use("/API", require("./endpoints/deletes/deleteProduct"));

// Catches all other 'incorrect' requests
app.all(
	"*",
	function(request, response, next) {
		response.status(400).send("No path or incorrect path provided");
		response.end();
	}
);

// Schedule task every day at 7 in the morning
var rule = new schedule.RecurrenceRule();
rule.hours = 7;
rule.minute = 0;

schedule.scheduleJob(
	rule, // * 7 * * *
	function() {
		pool.query(
			"DELETE FROM `order` WHERE `order`.Handled = 0;",
			function(errorA, rowsA, fieldsA) {
				if (!errorA) {
					console.log("Unhandled orders deleted at 07:00");
				} else {
					// API failure
					console.log("Unable to delete unhandled orders at 07:00");
				}
			}
		);
	}
);

// Open server
app.listen(
	process.env.PORT || 8080,
	function() {
		console.log("Server is online");
	}
);

