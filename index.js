var http = require("http");
var express = require("express");
var app = express();
var mysql = require("mysql");
var bodyParser = require("body-parser");
/*
//start mysql connection
var connection = mysql.createConnection({
  host     : 'bpxswzqwuifl3kr6kmvs-mysql.services.clever-cloud.com', 
  user     : 'uyiwk6c2x0ro5pzh', 
  password : 'M5eeq0ubvKc4w7dGz9sA', 
  database : 'bpxswzqwuifl3kr6kmvs' 
});
*/

//end mysql connection

var db_config = {
  host: "bpxswzqwuifl3kr6kmvs-mysql.services.clever-cloud.com",
  user: "uyiwk6c2x0ro5pzh",
  password: "M5eeq0ubvKc4w7dGz9sA",
  database: "bpxswzqwuifl3kr6kmvs",
};

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
  // the old one cannot be reused.

  connection.connect(function (err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  connection.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

//start body-parser configuration
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
//end body-parser configuration

//create app server
var port1 = process.env.PORT || 8000;
var server = app.listen(port1, "127.0.0.1", function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Api server listening at http://%s:%s", host, port);
});

//rest api to get all customers
app.get("/pedido", function (req, res) {
  connection.query("select * from pedido", function (error, results, fields) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});
//rest api to get a single pedido data
app.get("/pedido/:id", function (req, res) {
  connection.query(
    "select * from pedido where idpedido=?",
    [req.params.id],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

//rest api to create a new pedido record into mysql database
app.post("/pedido", function (req, res) {
  var params = req.body;
  console.log(params);
  connection.query("INSERT INTO pedido SET ?", params, function (
    error,
    results,
    fields
  ) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});

//rest api to update record into mysql database
app.put("/pedido", function (req, res) {
  connection.query(
    "UPDATE `pedido` SET `Name`=?,`Address`=?,`Country`=?,`Phone`=? where `idpedido`=?",
    [
      req.body.Name,
      req.body.Address,
      req.body.Country,
      req.body.Phone,
      req.body.Id,
    ],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

//rest api to delete record from mysql database
app.delete("/pedido", function (req, res) {
  console.log(req.body);
  connection.query(
    "DELETE FROM `pedido` WHERE `idpedido`=?",
    [req.body.Id],
    function (error, results, fields) {
      if (error) throw error;
      res.end("Record has been deleted!");
    }
  );
});
