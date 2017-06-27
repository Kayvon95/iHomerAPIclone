
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.get(
	"/getDeviceInfo",
	function(request, response, next) {
		var params = require("url").parse(request.url, true).query;
		if ("fingerprint" in params) {
			var deviceSQL = "SELECT * FROM deviceinfo WHERE Fingerprint = '" + params["fingerprint"] + "';";
			pool.query(
				deviceSQL,
				function(error, rows, fields) {
					if (!error) {
						if (rows.length > 0) {
							response.status(200);
							response.json(rows[0]);
						} else {
							response.status(404).send("Device not found");
						}
					} else {
						// Unexpected error
						response.status(500).send("API failed to execute correctly");
					}
					response.end();
				}
			);
		} else {
			if ("email" in params) {
				var deviceSQL = "SELECT * FROM deviceinfo WHERE Email = '" + params["email"] + "';";
				pool.query(
					deviceSQL,
					function(error, rows, fields) {
						if (!error) {
							if (rows.length > 0) {
								response.status(200);
								response.json(rows[0]);
							} else {
								response.status(404).send("Device not found");
							}
						} else {
							// Unexpected error
							response.status(500).send("API failed to execute correctly");
						}
						response.end();
					}
				);
			} else {
				response.status(400).send("Unable to handle request");
				response.end();
			}
		}
	}
);

module.exports = router;
