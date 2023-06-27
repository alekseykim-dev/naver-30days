const express = require("express");
const mariadb = require("mariadb");
require("dotenv").config();
const axios = require("axios");
const CryptoJS = require("crypto-js");

const app = express();

// Create a connection pool to the MariaDB database
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
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

const baseURL = "https://api.searchad.naver.com";
const path = "/keywordstool";
const apiKey = process.env.API_KEY;
const secretKey = process.env.SECRET_KEY;
const customerId = process.env.CUSTOMER_ID;

const timestamp = Date.now().toString();
const method = "GET";
const sign = `${timestamp}.${method}.${path}`;
const signature = CryptoJS.enc.Base64.stringify(
  CryptoJS.HmacSHA256(sign, secretKey)
);

const headers = {
  "X-API-KEY": apiKey,
  "X-Customer": customerId,
  "X-Timestamp": timestamp,
  "X-Signature": signature,
};
const key = "서울";
const url = baseURL + path + `?hintKeywords=${key}`;

axios
  .get(url, { headers })
  .then(async (response) => {
    const keywordList = response.data.keywordList;
    console.log("Keyword List:", keywordList);
    console.log("Keyword List Type:", typeof keywordList);

    try {
      const conn = await pool.getConnection();

      const insertQuery =
        "INSERT INTO 30days (timeUnit, relKeyword, period, monthlyPcQcCnt, monthlyMobileQcCnt, monthlyTotalQcCnt, insertedDate) VALUES (?, ?, ?, ?, ?, ?, CURDATE())";

      for (const keyword of keywordList) {
        const { relKeyword, monthlyPcQcCnt, monthlyMobileQcCnt } = keyword;
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 1); // Subtract 1 day from the current date
        const period = currentDate.toISOString().slice(0, 10);

        const monthlyTotalQcCnt = monthlyPcQcCnt + monthlyMobileQcCnt; // Calculate the sum
        console.log("monthlyTotalQcCnt: ", monthlyTotalQcCnt);

        try {
          await conn.query(insertQuery, [
            "date",
            relKeyword,
            period,
            monthlyPcQcCnt,
            monthlyMobileQcCnt,
            monthlyTotalQcCnt,
          ]);
          console.log("Data inserted into the database");
        } catch (error) {
          // Handle duplicate entry error
          if (error.code === "ER_DUP_ENTRY") {
            console.log(
              `Duplicate entry for keyword '${relKeyword}' and period '${period}'. Skipping insertion.`
            );
          } else {
            console.error("Error inserting data into the database:", error);
          }
        }
      }

      conn.release();
    } catch (error) {
      console.error("Error connecting to the database:", error);
    }
  })
  .catch((error) => {
    console.error("Error requesting data from API:", error);
  });

// Set up Express server
app.listen(3003, () => {
  console.log("Server is running on PORT 3003");
});
