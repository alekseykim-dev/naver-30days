const mariadb = require("mariadb");
require('dotenv').config();

class DatabaseConnector {
  constructor() {
    this.pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
    });
  }

  async connect() {
    try {
      const connection = await this.pool.getConnection();

      if (connection) {
        console.log("Connected to the database");
        connection.release(); // Release the connection after checking
      }
    } catch (error) {
      console.error("Error connecting to the database:", error);
    }
  }

  async processData() {
    try {
      const conn = await this.pool.getConnection();

      // Get the ratio and period data from the daily table
      const getRatioData = await conn.query(
        "SELECT ratio, period FROM daily ORDER BY period ASC"
      );

      const startDate = new Date("2016-01-01"); // Start date for calculation

      for (let i = 0; i < getRatioData.length; i++) {
        const { ratio, period } = getRatioData[i];

        const insertedDate = new Date().toISOString().split("T")[0]; // Get the current date for insertedDate

        let calculatedRatio; // Declare the variable here
        let realNum; // Declare the realNum variable here

        if (period < startDate) {
          // For periods before 2016-01-01, set realNum to 0
          calculatedRatio = 0;
          realNum = 0;
        } else if (period === startDate) {
          // For 2016-01-01, use the first available ratio value after that date to calculate realNum
          const firstRatioAfterStartDate = getRatioData[i + 1]?.ratio;
          if (firstRatioAfterStartDate) {
            calculatedRatio = firstRatioAfterStartDate; // Use the first available ratio
            const getMonthlyTotalQcCnt = await conn.query(
              "SELECT monthlyTotalQcCnt FROM 30days WHERE insertedDate <= ? ORDER BY insertedDate DESC LIMIT 1",
              [insertedDate]
            );
            const monthlyTotalQcCnt = getMonthlyTotalQcCnt[0]?.monthlyTotalQcCnt || 0;
            realNum = parseFloat(calculatedRatio) * monthlyTotalQcCnt;
          } else {
            console.error("No available ratio data after 2016-01-01");
            continue; // Skip the insertion for this period
          }
        } else {
          // Calculate the ratio
          const lastDayRatio = ratio;

          // Get the most recent monthlyTotalQcCnt from 30days table
          const getMonthlyTotalQcCnt = await conn.query(
            "SELECT monthlyTotalQcCnt FROM 30days WHERE insertedDate <= ? ORDER BY insertedDate DESC LIMIT 1",
            [insertedDate]
          );
          const monthlyTotalQcCnt = getMonthlyTotalQcCnt[0]?.monthlyTotalQcCnt || 0;

          // Get the sum of the last 30 days' ratios based on period
          const getLast30DaysSum = await conn.query(
            "SELECT SUM(ratio) AS sum FROM (SELECT ratio FROM daily WHERE period <= ? ORDER BY period DESC LIMIT 30) AS subquery",
            [period]
          );
          const last30DaysSum = getLast30DaysSum[0]?.sum || 0;

          // Calculate the ratio
          calculatedRatio = lastDayRatio / last30DaysSum; // Assign the value here

          // Check if the calculatedRatio is a valid number
          if (isNaN(calculatedRatio)) {
            console.error(`Invalid ratio value for period: ${period}`);
            continue; // Skip the insertion for this period
          }

          // Format the ratio with desired decimal precision
          const formattedRatio = calculatedRatio.toFixed(6); // Change 6 to the desired number of decimal places

          // Calculate the multiplied ratio with monthlyTotalQcCnt
          realNum = parseFloat(formattedRatio) * monthlyTotalQcCnt;
        }

        // Insert the calculated ratio, realNum, and period into the ratio_data table
        const insertQuery =
          "INSERT IGNORE INTO ratio_data (ratio, realNum, insertedDate, period) VALUES (?, ?, ?, ?)";
        await conn.query(insertQuery, [
          Number.parseFloat(calculatedRatio), // Parse the calculatedRatio as a number
          Number.parseFloat(realNum).toFixed(3), // Parse the realNum as a number and fix it to 3 decimal places
          insertedDate,
          period,
        ]);
      }

      // Retrieve and list the values of the ratio_data table with insertedDate in ascending order and period in ascending order
      const ratioDataQuery = "SELECT * FROM ratio_data ORDER BY period ASC";
      const ratioData = await conn.query(ratioDataQuery);

      console.log("Ratio Data (Period: Ascending)");
      console.log(ratioData);

      conn.release(); // Release the connection after using it
    } catch (err) {
      console.error("Error occurred:", err);
    }
  }
}

// Usage
const connector = new DatabaseConnector();
connector.connect();
connector.processData();
