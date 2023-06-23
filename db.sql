-- CREATE TABLE 30days (
--   timeUnit VARCHAR(10) NOT NULL,
--   relKeyword VARCHAR(255) NOT NULL,
--   period DATE NOT NULL,
--   monthlyPcQcCnt VARCHAR(10) NOT NULL,
--   monthlyMobileQcCnt VARCHAR(10) NOT NULL,
--   insertedDate DATE NOT NULL
-- );


CREATE TABLE 30days (
  timeUnit VARCHAR(10) NOT NULL,
  relKeyword VARCHAR(255) NOT NULL,
  period DATE NOT NULL,
  monthlyPcQcCnt VARCHAR(10) NOT NULL,
  monthlyMobileQcCnt VARCHAR(10) NOT NULL,
  insertedDate DATE NOT NULL,
  UNIQUE KEY unique_keyword_period (relKeyword, period)
  
);


--ALTER TABLE 30days ADD COLUMN monthlyTotalQcCnt INT;
