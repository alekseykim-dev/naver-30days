const express = require("express");
const mariadb = require("mariadb");
const axios = require("axios");
const request = require("request");

const app = express();
const pool = mariadb.createPool({
  host: "localhost",
  user: "admin",
  password: "tpkris56w",
  database: "naver30",
  port: "3306",
});

pool
  .getConnection()
  .then((connection) => {
    if (connection) {
      console.log("Connected to the database");
      connection.release(); // Release the connection after checking
    }
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });


  app.listen(3003, async () => {
    console.log("Server is running on PORT 3003");


  });  