const mariadb = require("mariadb");
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
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

(async () => {
  try {
    const conn = await pool.getConnection();

    // Get the last day's ratio
    const getLastDayRatio = await conn.query(
      "SELECT ratio FROM daily ORDER BY period DESC LIMIT 1"
    );
    console.log('getLastDayRatio:', getLastDayRatio)
    const lastDayRatio = getLastDayRatio[0]?.ratio || 0;
        console.log('lastDayRatio:', lastDayRatio)
    // Get the sum of the last 30 days' ratios
    const getLast30DaysSum = await conn.query(
      "SELECT SUM(ratio) AS sum FROM (SELECT ratio FROM daily ORDER BY period DESC LIMIT 30) AS subquery"
    );
    console.log('getLast30DaysSum:', getLast30DaysSum)
    const last30DaysSum = getLast30DaysSum[0]?.sum || 0;
        console.log('last30DaysSum:', last30DaysSum)
    // Calculate the ratio
    const ratio = lastDayRatio / last30DaysSum;
        console.log('ratio:', ratio)
    // Get the monthlyTotalQcCnt from 30days table
    const getMonthlyTotalQcCnt = await conn.query(
      "SELECT monthlyTotalQcCnt FROM 30days ORDER BY insertedDate DESC LIMIT 1"
    );
    console.log('getMonthlyTotalQcCnt:', getMonthlyTotalQcCnt)
    const monthlyTotalQcCnt = getMonthlyTotalQcCnt[0]?.monthlyTotalQcCnt || 0;
        console.log('monthlyTotalQcCnt:', monthlyTotalQcCnt)
    // Calculate the multiplied ratio with monthlyTotalQcCnt
    const realNum = ratio * monthlyTotalQcCnt;
        console.log('realNum:', realNum)
    // Insert the calculated ratio and realNum into the ratio_data table
    const insertQuery =
      "INSERT INTO ratio_data (ratio, realNum, insertedDate) VALUES (?, ?, CURDATE())";
    await conn.query(insertQuery, [ratio, realNum]);

    conn.release();
    console.log("Ratio calculation complete");
  } catch (error) {
    console.error("Error calculating and inserting ratio:", error);
  } finally {
    pool.end(); // Close the connection pool
  }
})();
 