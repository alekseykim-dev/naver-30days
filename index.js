const express = require("express");
const mariadb = require("mariadb");
require("dotenv").config();
const axios = require("axios");
const CryptoJS = require("crypto-js");

class App {
  constructor() {
    this.app = express();
    this.pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
    });

    this.baseURL = "https://api.searchad.naver.com";
    this.path = "/keywordstool";
    this.apiKey = process.env.API_KEY;
    this.secretKey = process.env.SECRET_KEY;
    this.customerId = process.env.CUSTOMER_ID;

    this.timestamp = Date.now().toString();
    this.method = "GET";
    this.sign = `${this.timestamp}.${this.method}.${this.path}`;
    this.signature = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(this.sign, this.secretKey)
    );

    this.headers = {
      "X-API-KEY": this.apiKey,
      "X-Customer": this.customerId,
      "X-Timestamp": this.timestamp,
      "X-Signature": this.signature,
    };

    this.key = "서울";
    this.url = this.baseURL + this.path + `?hintKeywords=${this.key}`;
  }

  async start() {
    try {
      await this.testDatabaseConnection();
      await this.fetchDataFromAPI();
      this.setupServer();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async testDatabaseConnection() {
    try {
      const connection = await this.pool.getConnection();
      if (connection) {
        console.log("Connected to the database");
        connection.release();
      }
    } catch (error) {
      throw new Error("Error connecting to the database: " + error);
    }
  }

  async fetchDataFromAPI() {
    try {
      const response = await axios.get(this.url, { headers: this.headers });
      const keywordList = response.data.keywordList;
      console.log("Keyword List:", keywordList);
      console.log("Keyword List Type:", typeof keywordList);

      const conn = await this.pool.getConnection();

      const insertQuery =
        "INSERT INTO 30days (timeUnit, relKeyword, period, monthlyPcQcCnt, monthlyMobileQcCnt, monthlyTotalQcCnt, insertedDate) VALUES (?, ?, ?, ?, ?, ?, CURDATE())";

      for (const keyword of keywordList) {
        const { relKeyword, monthlyPcQcCnt, monthlyMobileQcCnt } = keyword;
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 1);
        const period = currentDate.toISOString().slice(0, 10);
        const monthlyTotalQcCnt = monthlyPcQcCnt + monthlyMobileQcCnt;

        console.log("monthlyTotalQcCnt: ", monthlyTotalQcCnt);

        try {
          await conn.query(insertQuery, [
            "monthly",
            relKeyword,
            period,
            monthlyPcQcCnt,
            monthlyMobileQcCnt,
            monthlyTotalQcCnt,
          ]);
          console.log("Data inserted into the database");
        } catch (error) {
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
      throw new Error("Error requesting data from API: " + error);
    }
  }

  setupServer() {
    this.app.listen(3003, () => {
      console.log("Server is running on PORT 3003");
    });
  }
}

const app = new App();
app.start();
