const express = require("express");
const mariadb = require("mariadb");
require('dotenv').config();
const axios = require('axios');

const CryptoJS = require('crypto-js');


const app = express();

// Create a connection pool to the MariaDB database
const pool = mariadb.createPool({
  host: "localhost",
  user: "admin",
  password: "tpkris56w",
  database: "naver30",
  port: "3306",
});

// Test the database connection
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


  const baseURL = 'https://api.searchad.naver.com';
const path = '/keywordstool';
const apiKey = process.env.API_KEY;
const secretKey = process.env.SECRET_KEY;
const customerId = process.env.CUSTOMER_ID;

const timestamp = Date.now().toString();
const method = 'GET';
const sign = `${timestamp}.${method}.${path}`;
const signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(sign, secretKey));

const headers = {
  'X-API-KEY': apiKey,
  'X-Customer': customerId,
  'X-Timestamp': timestamp,
  'X-Signature': signature
};
const key = "apple";
const url = baseURL + path + `?hintKeywords=${key}`;

axios.get(url, { headers })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
  
// Set up Express server
app.listen(3003, async () => {
  console.log("Server is running on PORT 3003");
});


