const express = require("express");
const mariadb = require("mariadb");
require('dotenv').config();
const RestApi = require('./restapi');

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

// Set up Express server
app.listen(3003, async () => {
  console.log("Server is running on PORT 3003");

  const api = new RestApi(
    this.baseUrl,
    this.apiKey ,
    this.secretKey ,
    this.customerId
  );

  console.log('Test Keywordstool');
//   const keyword = "korea"; // Specify your desired keyword here

  try {
    const response = await api.GET('/keywordstool?hintKeywords=apple');
    console.log('Response:', response);

    if (response && response.keywordList && response.keywordList.length > 0) {
      const keywords = response.keywordList.map(keywordData => keywordData.relKeyword);
      console.log('Keywords:', keywords);
    } else {
      console.log('No keyword list found in the response.');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }

  console.log('\nTest End');
});
