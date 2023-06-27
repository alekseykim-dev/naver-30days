-- CREATE TABLE 30days (
--   timeUnit VARCHAR(10) NOT NULL,
--   relKeyword VARCHAR(255) NOT NULL,
--   period DATE NOT NULL,
--   monthlyPcQcCnt VARCHAR(10) NOT NULL,
--   monthlyMobileQcCnt VARCHAR(10) NOT NULL,
--   insertedDate DATE NOT NULL
-- );


CREATE TABLE IF NOT EXISTS 30days (
  timeUnit VARCHAR(10) NOT NULL,
  relKeyword VARCHAR(255) NOT NULL,
  period DATE NOT NULL,
  monthlyPcQcCnt VARCHAR(10) NOT NULL,
  monthlyMobileQcCnt VARCHAR(10) NOT NULL,
  monthlyTotalQcCnt INT,
  insertedDate DATE NOT NULL,
  UNIQUE KEY unique_keyword_period (relKeyword, period)
);

--ALTER TABLE 30days ADD COLUMN monthlyTotalQcCnt INT;



CREATE TABLE IF NOT EXISTS ratio_data (
  period DATE NOT NULL,
  ratio DECIMAL(18, 6),
  realNum DECIMAL(10, 2),
  insertedDate DATE
);


-- CREATE TABLE IF NOT EXISTS ratio_data (
--   ratio DECIMAL(10, 2),
--   realNum DECIMAL(10, 2),
--   insertedDate DATE,
--   period DATE
-- );



-- CREATE TABLE IF NOT EXISTS ratio_data (
--   period DATE NOT NULL,
--   ratio DECIMAL(10, 2),
--   realNum DECIMAL(10, 2),
--   insertedDate DATE,
--   PRIMARY KEY (period)
-- );

