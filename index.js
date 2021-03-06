var http = require("http");
const https = require("https");
var express = require("express");
var app = express();
var mysql = require("mysql");
var bodyParser = require("body-parser");
const axios = require("axios");
const fetch = require("node-fetch");

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
app.use(function (req, res, next) {
  res.header("");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
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
var port = process.env.PORT || 8000;
var server = http.Server(app);
app.use(express.static("client"));
server.listen(port, function () {
  console.log("Runnig app at", port);
  //SEE WHAT HAPPENS
  //console.log(port);
});

app.get("/", function (req, res) {
  res.end(JSON.stringify({ message: "Bienvenido a la API de AlfaSoft" }));
});

//rest api to get all pedidos
app.get("/pedido", function (req, res) {
  connection.query("select * from pedido order by idpedido desc", function (error, results, fields) {
    if (error) throw error;
    res.end(JSON.stringify(results));
  });
});


/*
app.get("/productopedido/:id", function (req, res) {
  connection.query(
    "select * from pedidoProductos where pedido_idpedido=?",
    [req.params.id],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

*/

//consulta agregada 1 sorted by idpedido
app.get("/pedidousuario", function (req, res) {
  connection.query(
    "SELECT idcliente, nombre as nombreCli ,idpedido, direccion, fechaPedido, cantidadTotal, totalPagar, estado, estadoPago FROM pedido, cliente  where pedido.idclienteP = cliente.idcliente order by idpedido desc",
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

//consulta agregada 1 con Parametro
app.get("/pedidousuario/:id", function (req, res) {
  connection.query(
    "SELECT idcliente, nombre as nombreCli ,idpedido, direccion, fechaPedido, cantidadTotal, totalPagar, estado, estadoPago FROM pedido, cliente where pedido.idclienteP = cliente.idcliente and  pedido.idclienteP=? order by idpedido desc",
    [req.params.id],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

//consulta agregada 2
app.get("/productopedido", function (req, res) {
  connection.query(
    "SELECT pedido_idpedido, nombre , cantidadComp, precio FROM pedidoProductos, producto where pedidoProductos.producto_idproducto = producto.idproducto",
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});
//consulta 2 con parametro de idpedido
app.get("/productopedido/:id", function (req, res) {
  connection.query(
    "SELECT pedido_idpedido, nombre , cantidadComp, precio FROM pedidoProductos, producto where pedidoProductos.producto_idproducto = producto.idproducto and pedido_idpedido=?",
    [req.params.id],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});



async function firstFunction(values) {
  console.log("En la funcion 1", values);
  var someMessage;
  connection.query("INSERT INTO cliente SET ?", values, function (err, result) {
    if (err) throw err;
    console.log("Inserted users: " + result.affectedRows);
    someMessage = JSON.stringify(result);
  });
  return someMessage;
}

async function secondFunction(data) {
  await firstFunction(data);
  // now wait for firstFunction to finish...
  // do something else
}

//---------------------------------------------

//---------------------------------------------

//New user
//Firts check if user exits
//then if dont
app.post("/pedido", function (req, res) {
  var dataFilds = req.body;
  var carnet = req.body.idclienteP.ci;
  var direccion = req.body.direccion;
  var fechaPedido = req.body.fechaPedido;
  var totalPagar = req.body.totalPagar;
  var cantidadTotal = req.body.cantidadTotal;

  var nameFull = req.body.idclienteP.nombreFull;

  const newPedido = {
    direccion: direccion,
    fechaPedido: fechaPedido,
    cantidadTotal: cantidadTotal,
    totalPagar: totalPagar,
    idclienteP: carnet,
    estado: "Pendiente",
  };
  connection.query(
    "select idcliente as masa from cliente where idcliente=?;",
    carnet,
    function (err, result, fields) {
      if (err) throw err;
      //console.log(result[0].masa,"");

      if (result.length > 0) {
        console.log("User Found");

        var sql = "INSERT INTO pedido SET ?";

        connection.query(sql, [newPedido], function (err, result) {
          if (err) throw err;
          console.log(
            " Number of records inserted on pedidos: " + result.affectedRows
          );
          res.end(JSON.stringify(result));
        });
      } else {
        console.log("User not Found");
        console.log(carnet, nameFull);
        var newUser = {
          idcliente: carnet,
          nombre: nameFull,
          username: "noExiste",
          password: "noExiste",
        };
        secondFunction(newUser);
        var sql = "INSERT INTO pedido SET ?";

        connection.query(sql, [newPedido], function (err, result) {
          if (err) throw err;
          console.log(
            " Number of records inserted on pedidos: " + result.affectedRows
          );
          res.end(JSON.stringify(result));
        });
      }
    }
  );
});

//rest api to get a single pedido data Sorted on idpedido
app.get("/pedido/:id", function (req, res) {
  connection.query(
    "select * from pedido where idpedido=? order by idpedido desc",
    [req.params.id],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

//get users
app.post("/auth", function (request, response) {
  var username = request.body.username;
  var password = request.body.password;

  if (username && password) {
    connection.query(
      "SELECT * FROM cliente WHERE username = ? AND password = ?",
      [username, password],
      function (error, results, fields) {
        if (results.length > 0) {
          //console.log("u are in bro!!!");
          response.end(JSON.stringify(results));
          //response.send({ message: "u are in" });
        } else {
          //response.send("Incorrect Username and/or Password!");
          response.end(JSON.stringify(results));
        }
        response.end();
      }
    );
  } else {
    response.send("Please enter Username and Password!");
    response.end();
  }
});

//rest api to get all productos
app.get("/productos", function (req, res) {
  connection.query(
    "select * from producto",
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
  connection.query(
    "INSERT INTO pedido SET ?",
    params,
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});
//multiple inserts on pedidosProductos Items
app.post("/pedido/items", function (req, res) {
  connection.query(
    "select max(idpedido) as masa from pedido;",
    function (err, result, fields) {
      if (err) throw err;
      console.log(result[0].masa, "The last insert id in pedido");
      console.log(req.body);
      if (result.length > 0) {
        var sql =
          "INSERT INTO pedidoProductos (pedido_idpedido, producto_idproducto, cantidadComp) VALUES ?";
        var values = [];
        for (var i = 0; i < req.body.length; i++) {
          values.push([
            result[0].masa,
            req.body[i].producto_idproducto,
            req.body[i].cantidadComp,
          ]);
        }
        connection.query(sql, [values], function (err, result) {
          if (err) throw err;
          console.log(
            " Number of records inserted on pedidosProductos: " +
              result.affectedRows
          );
          res.end(JSON.stringify(result));
        });
      } else {
        console.log("No data found");
      }
    }
  );
});
/*
//rest api to create a enbed sql inserts
app.post("/pedido", function (req, res) {
  var params = req.body;
  console.log(params);
  connection.query(
    "INSERT INTO pedido SET ?",
    params,
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});
*/
//rest api to update record into mysql database

app.put("/pedidos", function (req, res) {
  connection.query(
    "UPDATE `pedido` SET `direccion`=?,`fechaPedido`=?,`cantidadTotal`=?,`totalPagar`=?,`idclienteP`=?,`estado`=?, `estadoPago`=? where `idpedido`=?",
    [
      req.body.direccion,
      req.body.fechaPedido,
      req.body.cantidadTotal,
      req.body.totalPagar,
      req.body.idclienteP,
      req.body.estado,
      req.body.idpedido,
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

app.post("/estadoPedido/", function (req, res) {
  var estado = req.body.estado;
  var idpedido = req.body.idpedido;
  connection.query(
  " UPDATE pedido SET estado = ? WHERE idpedido= ?",[estado, idpedido],
function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});

//insert pedido
app.post("/pedidoIn", function (req, res) {
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
