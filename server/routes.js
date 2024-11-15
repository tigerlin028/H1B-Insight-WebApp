const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const config = require('./config.json');

const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Route 1: Industry H1B approval rates
const industryApproval = async function(req, res) {
  const query = `
    WITH h1b_clean AS (
      SELECT * FROM h1b WHERE matched_company_id IS NOT NULL
    )
    SELECT 
      ci.industry,
      ROUND((SUM(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as approval_rate
    FROM h1b_clean h
    JOIN companies c ON h.matched_company_id = c.company_id
    JOIN company_industries ci ON c.company_id = ci.company_id
    GROUP BY ci.industry
    ORDER BY approval_rate DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 2: Industry salary statistics
const industrySalary = async function(req, res) {
  const query = `
    WITH yearly_salaries AS (
      SELECT s.min_salary, s.max_salary, ci.industry, p.company_id
      FROM salary s
      JOIN postings p ON s.job_id = p.job_id
      JOIN company_industries ci ON p.company_id = ci.company_id
      WHERE s.pay_period = 'YEARLY'
    )
    SELECT 
      industry,
      COUNT(*) as job_count,
      ROUND(AVG(min_salary)) as avg_min_salary,
      ROUND(AVG(max_salary)) as avg_max_salary,
      ROUND((AVG(min_salary) + AVG(max_salary)) / 2) as avg_mid_salary
    FROM yearly_salaries
    GROUP BY industry
    HAVING COUNT(*) >= 10
    ORDER BY avg_mid_salary DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 3: Company size analysis
const companySizeStats = async function(req, res) {
  const query = `
    WITH company_size_groups AS (
      SELECT 
        c.company_id,
        CASE
          WHEN ec.employee_count < 100 THEN 'Small (<100)'
          WHEN ec.employee_count < 1000 THEN 'Medium (100-999)'
          WHEN ec.employee_count < 10000 THEN 'Large (1000-9999)'
          ELSE 'Huge (10000+)'
        END as size_category
      FROM companies c
      JOIN employee_counts ec ON c.company_id = ec.company_id
    )
    SELECT
      csg.size_category,
      ci.industry,
      COUNT(DISTINCT h.matched_company_id) as companies_count,
      COUNT(*) as total_applications,
      ROUND(AVG(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) * 100, 2) as approval_rate
    FROM h1b h
    JOIN company_size_groups csg ON h.matched_company_id = csg.company_id
    JOIN company_industries ci ON csg.company_id = ci.company_id
    WHERE h.matched_company_id IS NOT NULL
    GROUP BY csg.size_category, ci.industry
    HAVING COUNT(*) >= 5
    ORDER BY size_category, approval_rate DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 4: H1B applications by nationality
const nationalityStats = async function(req, res) {
  const query = `
    WITH nationality_stats AS (
      SELECT
        COALESCE(country_of_birth, country_of_nationality) as country,
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as approved_applications
      FROM h1b
      WHERE COALESCE(country_of_birth, country_of_nationality) IS NOT NULL
      GROUP BY COALESCE(country_of_birth, country_of_nationality)
      HAVING COUNT(*) >= 5
    )
    SELECT
      country,
      total_applications,
      approved_applications,
      CAST(approved_applications * 100.0 / total_applications AS DECIMAL(5,2)) as approval_rate
    FROM nationality_stats
    ORDER BY total_applications DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 5: Remote work analysis
const remoteWorkStats = async function(req, res) {
  const query = `
    SELECT
      CASE
        WHEN p.remote_allowed = 1 THEN 'Remote Allowed'
        ELSE 'Not Specified'
      END as work_arrangement,
      COUNT(*) as total_applications,
      ROUND(AVG(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) * 100, 2) as approval_rate,
      ROUND(AVG((s.min_salary + s.max_salary)/2)) as avg_salary,
      COUNT(DISTINCT p.company_id) as unique_companies
    FROM h1b h
    JOIN postings p ON h.employer_name = p.company_name
    JOIN salary s ON p.job_id = s.job_id
    WHERE s.pay_period = 'YEARLY'
    GROUP BY
      CASE
        WHEN p.remote_allowed = 1 THEN 'Remote Allowed'
        ELSE 'Not Specified'
      END
    ORDER BY total_applications DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 6: Job level analysis
const jobLevelStats = async function(req, res) {
  const query = `
    WITH job_characteristics AS (
      SELECT
        CASE
          WHEN LOWER(p.title) LIKE '%senior%' OR LOWER(p.title) LIKE '%sr%' OR LOWER(p.title) LIKE '%lead%' THEN 'Senior Level'
          WHEN LOWER(p.title) LIKE '%junior%' OR LOWER(p.title) LIKE '%jr%' OR LOWER(p.title) LIKE '%associate%' THEN 'Junior Level'
          ELSE 'Mid Level'
        END as seniority_level,
        p.work_type,
        s.min_salary,
        s.max_salary,
        ci.industry
      FROM postings p
      JOIN salary s ON p.job_id = s.job_id
      JOIN company_industries ci ON p.company_id = ci.company_id
      WHERE s.pay_period = 'YEARLY'
    )
    SELECT
      seniority_level,
      work_type,
      industry,
      COUNT(*) as job_count,
      ROUND(AVG(min_salary)) as avg_min_salary,
      ROUND(AVG(max_salary)) as avg_max_salary,
      ROUND(AVG(max_salary - min_salary)) as avg_salary_range
    FROM job_characteristics
    GROUP BY seniority_level, work_type, industry
    HAVING COUNT(*) >= 5
    ORDER BY seniority_level, job_count DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 7: Company tier analysis
const companyTierStats = async function(req, res) {
  const query = `
    WITH company_tiers AS (
      SELECT
        c.company_id,
        ci.industry,
        CASE
          WHEN ec.employee_count < 100 THEN 'Startup'
          WHEN ec.employee_count < 1000 THEN 'SMB'
          ELSE 'Enterprise'
        END as company_size,
        ec.employee_count,
        ec.follower_count
      FROM companies c
      JOIN employee_counts ec ON c.company_id = ec.company_id
      JOIN company_industries ci ON c.company_id = ci.company_id
    )
    SELECT
      ct.industry,
      ct.company_size,
      COUNT(DISTINCT ct.company_id) as company_count,
      ROUND(AVG(ct.follower_count)) as avg_followers,
      ROUND(AVG(ct.employee_count)) as avg_employees,
      COUNT(DISTINCT p.job_id) as total_jobs,
      ROUND(AVG(s.max_salary)) as avg_max_salary,
      ROUND(AVG(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) * 100, 2) as h1b_approval_rate
    FROM company_tiers ct
    LEFT JOIN postings p ON ct.company_id = p.company_id
    LEFT JOIN salary s ON p.job_id = s.job_id
    LEFT JOIN h1b h ON p.company_name = h.employer_name
    WHERE s.pay_period = 'YEARLY'
    GROUP BY ct.industry, ct.company_size
    HAVING COUNT(DISTINCT ct.company_id) >= 5
    ORDER BY company_count DESC, avg_max_salary DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 8: Gender statistics
const genderStats = async function(req, res) {
  const query = `
    SELECT
      gender,
      COUNT(*) as total_applications,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as approved_applications,
      CAST(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as approval_rate
    FROM h1b
    WHERE gender IS NOT NULL
    GROUP BY gender
    ORDER BY total_applications DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 9: State-based analysis
const stateStats = async function(req, res) {
  const query = `
    WITH standardized_states AS (
      /* State standardization CASE statement */
    )
    SELECT
      ss.standardized_state,
      COUNT(DISTINCT ss.company_id) as num_companies,
      COUNT(DISTINCT s.job_id) as num_jobs,
      CAST(AVG((s.min_salary + s.max_salary)/2) as INTEGER) as avg_salary,
      STRING_AGG(DISTINCT ci.industry, ', ') as top_industries
    FROM standardized_states ss
    JOIN postings p ON ss.company_id = p.company_id
    JOIN salary s ON p.job_id = s.job_id
    JOIN company_industries ci ON ss.company_id = ci.company_id
    WHERE s.pay_period = 'YEARLY'
    GROUP BY ss.standardized_state
    HAVING COUNT(DISTINCT ss.company_id) >= 5
    ORDER BY num_jobs DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

// Route 10: Industry size stats
const industrySizeStats = async function(req, res) {
  const query = `
    WITH industry_stats AS (
      SELECT
        ci.industry,
        COUNT(DISTINCT c.company_id) as company_count,
        AVG(ec.employee_count) as avg_employees
      FROM company_industries ci
      JOIN companies c ON ci.company_id = c.company_id
      JOIN employee_counts ec ON c.company_id = ec.company_id
      GROUP BY ci.industry
    )
    SELECT
      i.*,
      CASE
        WHEN avg_employees > 10000 THEN 'Huge'
        WHEN avg_employees > 1000 THEN 'Large'
        WHEN avg_employees > 100 THEN 'Medium'
        ELSE 'Small'
      END as size_category
    FROM industry_stats i
    WHERE company_count >= 5
    ORDER BY avg_employees DESC`;

  try {
    const data = await connection.query(query);
    res.json(data.rows);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
}

module.exports = {
  industryApproval,
  industrySalary,
  companySizeStats,
  nationalityStats,
  remoteWorkStats,
  jobLevelStats,
  companyTierStats,
  genderStats,
  stateStats,
  industrySizeStats
};
