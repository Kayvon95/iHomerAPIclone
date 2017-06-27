
var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var pool = require("../../database/dbConnection");

router.put(
	"/setDeviceInfo",
	function(request, response, next) {
		var params = request.body;
		if ("email" in params && "fingerprint" in params) {
			var args = {
				"Fingerprint": params["fingerprint"],
				"Email": params["email"]
			};
			if ("baseOS" in params) {
				args["BaseOS"] = params["baseOS"];
			}
			if ("brand" in params) {
				args["Brand"] = params["brand"];
			}
			if ("model" in params) {
				args["Model"] = params["model"];
			}
			if ("manufacturer" in params) {
				args["Manufacturer"] = params["manufacturer"];
			}
			if ("device" in params) {
				args["Device"] = params["device"];
			}
			if ("hardware" in params) {
				args["Hardware"] = params["hardware"];
			}
			pool.query(
				"SELECT Fingerprint FROM deviceinfo WHERE Fingerprint = '" + args["Fingerprint"] + "';",
				function(error, rows, fields) {
					if (!error) {
						if (rows.length > 0) {
							// Update
							var firstSet = true;
							var updateSQL = "UPDATE deviceinfo SET ";
							for (var k in args) {
								if (!firstSet) {
									updateSQL += (", " + k + " = '" + args[k] + "'");
								} else {
									updateSQL += (k + " = '" + args[k] + "'");
									firstSet = false;
								}
							}
							updateSQL += " WHERE Fingerprint = '" + args["Fingerprint"] + "';";
							console.log(updateSQL);

							pool.query(
								updateSQL,
								function(errorA, rowsA, fieldsA) {
									if (!errorA) {
										response.status(200);
										response.end();
									} else {
										// API error
										response.status(500).send("API failed to execute correctly 1");
										response.end();
									}
								}
							);
						} else {
							// New insert
							var firstInsert = true;
							var insertSQL = "INSERT INTO deviceinfo (";
							for (var k in args) {
								if (!firstInsert) {
									insertSQL += (", `"+k+"`");
								} else {
									insertSQL += ("`"+k+"`");
									firstInsert = false;
								}
							}
							firstInsert = true;
							insertSQL += ") VALUES (";
							for (var k in args) {
								if (!firstInsert) {
									insertSQL += (", '"+args[k]+"'");
								} else {
									insertSQL += "'"+args[k]+"'";
									firstInsert = false;
								}
							}
							insertSQL += ");";
							console.log(insertSQL);

							pool.query(
								insertSQL,
								function(errorB, rowsB, fieldsB) {
									if (!errorB) {
										response.status(200);
										response.end();
									} else {
										// API error
										response.status(500).send("API failed to execute correctly 2");
										response.end();
									}
								}
							);
						}
					} else {
						// API error
						response.status(500).send("API failed to execute correctly 3");
						response.end();
					}
				}
			);
		} else {
			response.status(400).send("Unable to handle request");
			response.end();
		}
	}
);

module.exports = router;
