const NodeCache = require('node-cache');
const { Pool } = require('pg');
const config = require('./config');

// Create singleton instances
const cache = new NodeCache({ stdTTL: 3600 });
const pool = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});

const cacheManager = {
  // Initialize cache
  initCache: function() {
    const startTime = Date.now();
    console.log('Starting cache initialization...');

    return this.warmCache()
      .then(() => {
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Cache initialization completed in ${duration} seconds`);
        return true;
      })
      .catch(error => {
        const duration = (Date.now() - startTime) / 1000;
        console.error(`Cache initialization failed after ${duration} seconds:`, error);
        throw error;
      });
  },


  // Cache warming
  warmCache: function() {
    console.log('Warming up cache...');
    return Promise.all([
      this.cacheCompanyStats(),
      this.cacheSalaryDistribution(),
      this.cacheH1BTrends(),
      this.cacheIndustryApproval(),
      this.cacheIndustrySalary(),
      this.cacheNationalityStats(),
      this.cacheCompanyTierStats(),
      this.cacheGenderStats(),
      this.cacheStateStats(),
      this.cacheIndustrySizeStats()
    ]).catch(error => {
      console.error('Cache warming failed:', error);
    });
  },

  // Getter methods
  getCompanyStats: function() {
    let data = cache.get('company_stats');
    if (!data) {
      return this.cacheCompanyStats();
    }
    return Promise.resolve(data);
  },

  getSalaryDistribution: function() {
    let data = cache.get('salary_distribution');
    if (!data) {
      return this.cacheSalaryDistribution();
    }
    return Promise.resolve(data);
  },

  getH1BTrends: function() {
    let data = cache.get('h1b_trends');
    if (!data) {
      return this.cacheH1BTrends();
    }
    return Promise.resolve(data);
  },

  getIndustryApproval: function() {
    let data = cache.get('industry_approval');
    if (!data) {
      return this.cacheIndustryApproval();
    }
    return Promise.resolve(data);
  },

  getIndustrySalary: function() {
    let data = cache.get('industry_salary');
    if (!data) {
      return this.cacheIndustrySalary();
    }
    return Promise.resolve(data);
  },

  getNationalityStats: function() {
    let data = cache.get('nationality_stats');
    if (!data) {
      return this.cacheNationalityStats();
    }
    return Promise.resolve(data);
  },

  getCompanyTierStats: function() {
    let data = cache.get('company_tier_stats');
    if (!data) {
      return this.cacheCompanyTierStats();
    }
    return Promise.resolve(data);
  },

  getGenderStats: function() {
    let data = cache.get('gender_stats');
    if (!data) {
      return this.cacheGenderStats();
    }
    return Promise.resolve(data);
  },

  getStateStats: function() {
    let data = cache.get('state_stats');
    if (!data) {
      return this.cacheStateStats();
    }
    return Promise.resolve(data);
  },

  getIndustrySizeStats: function() {
    let data = cache.get('industry_size_stats');
    if (!data) {
      return this.cacheIndustrySizeStats();
    }
    return Promise.resolve(data);
  },

  // Caching methods
  cacheCompanyStats: function() {
    return pool.query(`
      WITH 
company_h1b_metrics AS (
  SELECT 
    matched_company_id,
    COUNT(*) as total_apps,
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as approved_apps
  FROM h1b 
  WHERE matched_company_id IS NOT NULL 
  AND status IS NOT NULL
  GROUP BY matched_company_id
),
company_salary_metrics AS (
  SELECT 
    p.company_id,
    ROUND(AVG(s.max_salary)) as avg_max_salary
  FROM postings p
  JOIN salary s ON p.job_id = s.job_id
  WHERE s.pay_period = 'YEARLY'
  AND s.max_salary < 1000000
  AND s.max_salary > 0
  GROUP BY p.company_id
  HAVING COUNT(*) >= 1
)
SELECT 
  c.company_id,
  c.name as company_name,
  ci.industry,
  ec.employee_count,
  CASE
    WHEN ec.employee_count < 100 THEN 'Startup'
    WHEN ec.employee_count < 1000 THEN 'SMB'
    ELSE 'Enterprise'
  END as tier,
  hm.total_apps as total_h1b_applications,
  hm.approved_apps as approved_h1b_applications,
  ROUND((hm.approved_apps::DECIMAL * 100.0) / NULLIF(hm.total_apps, 0), 2) as h1b_approval_rate,
  COALESCE(sm.avg_max_salary, 0) as avg_max_salary
FROM companies c
JOIN company_industries ci ON c.company_id = ci.company_id
JOIN employee_counts ec ON c.company_id = ec.company_id
JOIN company_h1b_metrics hm ON c.company_id = hm.matched_company_id
LEFT JOIN company_salary_metrics sm ON c.company_id = sm.company_id
WHERE hm.total_apps >= 5
ORDER BY hm.total_apps DESC`
    ).then(result => {
      cache.set('company_stats', result.rows);
      return result.rows;
    });
  },

  cacheSalaryDistribution: function() {
    return pool.query(`
      WITH salary_bounds AS (
        SELECT 
          c.name as company_name,
          ci.industry,
          s.min_salary,
          s.max_salary,
          ec.employee_count
        FROM companies c
        JOIN company_industries ci ON c.company_id = ci.company_id
        JOIN postings p ON c.company_id = p.company_id
        JOIN salary s ON p.job_id = s.job_id
        JOIN employee_counts ec ON c.company_id = ec.company_id
        WHERE s.pay_period = 'YEARLY'
        AND s.min_salary > 0
        AND s.max_salary < 1000000
      )
      SELECT 
        company_name,
        industry,
        ROUND(AVG(min_salary)) as avg_min_salary,
        ROUND(AVG(max_salary)) as avg_max_salary,
        COUNT(*) as job_count,
        MAX(employee_count) as employee_count
      FROM salary_bounds
      GROUP BY company_name, industry, employee_count
      HAVING COUNT(*) >= 5
      ORDER BY AVG(max_salary) DESC`
    ).then(result => {
        cache.set('salary_distribution', result.rows);
        return result.rows;
        });
    },

    cacheH1BTrends: function() {
        return pool.query(`
            WITH yearly_stats AS (
        SELECT 
          c.name as company_name,
          h.lottery_year as year,
          COUNT(*) as applications,
          SUM(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) as approvals
        FROM h1b h
        JOIN companies c ON h.matched_company_id = c.company_id
        WHERE h.lottery_year IS NOT NULL
        GROUP BY c.name, h.lottery_year
        HAVING COUNT(*) >= 5
      )
      SELECT 
        company_name,
        year,
        applications,
        approvals,
        ROUND((approvals::DECIMAL / applications) * 100, 2) as approval_rate
      FROM yearly_stats
      ORDER BY company_name, year`
        ).then(result => {
            cache.set('h1b_trends', result.rows);
            return result.rows;
        });
    },

    cacheIndustryApproval: function() {
            return pool.query(`
                SELECT
    ci.industry,
    SUM(h.total_apps) AS total_applications,
    SUM(h.approved_apps) AS approved_applications,
    ROUND(
        CASE
            WHEN SUM(h.total_apps) > 0 THEN
                (SUM(h.approved_apps)::DECIMAL * 100.0) / SUM(h.total_apps)
            ELSE 0
        END,
        2
    ) AS approval_rate
FROM (
    SELECT
        h1b.matched_company_id,
        COUNT(*) AS total_apps,
        SUM(CASE WHEN h1b.status = 1 THEN 1 ELSE 0 END) AS approved_apps
    FROM h1b
    WHERE
        h1b.matched_company_id IS NOT NULL
        AND h1b.status IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM companies c
            WHERE c.company_id = h1b.matched_company_id
        )
        AND EXISTS (
            SELECT 1
            FROM company_industries ci
            WHERE ci.company_id = h1b.matched_company_id
              AND ci.industry IS NOT NULL
        )
    GROUP BY h1b.matched_company_id
) h
JOIN companies c ON h.matched_company_id = c.company_id
JOIN company_industries ci ON c.company_id = ci.company_id
WHERE ci.industry IS NOT NULL
GROUP BY ci.industry
HAVING SUM(h.total_apps) >= 5
ORDER BY approval_rate DESC
LIMIT 10;`
            ).then(result => {
                cache.set('industry_approval', result.rows);
                return result.rows;
            });
    },

    cacheIndustrySalary: function() {
            return pool.query(`
                WITH yearly_salaries AS (
        SELECT s.min_salary, s.max_salary, ci.industry
        FROM salary s
        JOIN postings p ON s.job_id = p.job_id
        JOIN company_industries ci ON p.company_id = ci.company_id
        WHERE s.pay_period = 'YEARLY'
        AND s.min_salary > 0
        AND s.max_salary < 1000000
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
      ORDER BY avg_mid_salary DESC`
            ).then(result => {
                cache.set('industry_salary', result.rows);
                return result.rows;
            });
    },

        cacheNationalityStats: function() {
            return pool.query(`
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
        ROUND((approved_applications::DECIMAL * 100.0 / total_applications), 2) as approval_rate
      FROM nationality_stats
      ORDER BY total_applications DESC`
            ).then(result => {
                cache.set('nationality_stats', result.rows);
                return result.rows;
            });
        },

        cacheCompanyTierStats: function() {
            return pool.query(`
             SELECT
    ci.industry,
    COUNT(DISTINCT c.company_id) as company_count,
    ROUND(AVG(ec.follower_count)) as avg_followers,
    ROUND(AVG(ec.employee_count)) as avg_employees,
    COUNT(DISTINCT p.job_id) as total_jobs,
    ROUND(AVG(s.max_salary)) as avg_max_salary,
    ROUND(AVG(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) * 100, 2) as h1b_approval_rate
FROM companies c
JOIN employee_counts ec ON c.company_id = ec.company_id
JOIN company_industries ci ON c.company_id = ci.company_id
LEFT JOIN postings p ON c.company_id = p.company_id
LEFT JOIN salary s ON p.job_id = s.job_id
LEFT JOIN h1b h ON p.company_id = h.matched_company_id
WHERE s.pay_period = 'YEARLY'
GROUP BY ci.industry
HAVING COUNT(DISTINCT c.company_id) >= 5
ORDER BY company_count DESC, avg_max_salary DESC`
            ).then(result => {
                cache.set('company_tier_stats', result.rows);
                return result.rows;
            });
        },

        cacheGenderStats: function() {
            return pool.query(`
                SELECT
        gender,
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as approved_applications,
        ROUND((SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END)::DECIMAL * 100.0 / COUNT(*)), 2) as approval_rate
      FROM h1b
      WHERE gender IS NOT NULL
      GROUP BY gender
      ORDER BY total_applications DESC`
            ).then(result => {
                cache.set('gender_stats', result.rows);
                return result.rows;
            });
        },

        cacheStateStats: function() {
            return pool.query(`
WITH state_mapping AS (
  SELECT 'Alabama' as state_name, 'AL' as state_abbr UNION
  SELECT 'Alaska', 'AK' UNION
  SELECT 'Arizona', 'AZ' UNION
  SELECT 'Arkansas', 'AR' UNION
  SELECT 'California', 'CA' UNION
  SELECT 'Colorado', 'CO' UNION
  SELECT 'Connecticut', 'CT' UNION
  SELECT 'Delaware', 'DE' UNION
  SELECT 'Florida', 'FL' UNION
  SELECT 'Georgia', 'GA' UNION
  SELECT 'Hawaii', 'HI' UNION
  SELECT 'Idaho', 'ID' UNION
  SELECT 'Illinois', 'IL' UNION
  SELECT 'Indiana', 'IN' UNION
  SELECT 'Iowa', 'IA' UNION
  SELECT 'Kansas', 'KS' UNION
  SELECT 'Kentucky', 'KY' UNION
  SELECT 'Louisiana', 'LA' UNION
  SELECT 'Maine', 'ME' UNION
  SELECT 'Maryland', 'MD' UNION
  SELECT 'Massachusetts', 'MA' UNION
  SELECT 'Michigan', 'MI' UNION
  SELECT 'Minnesota', 'MN' UNION
  SELECT 'Mississippi', 'MS' UNION
  SELECT 'Missouri', 'MO' UNION
  SELECT 'Montana', 'MT' UNION
  SELECT 'Nebraska', 'NE' UNION
  SELECT 'Nevada', 'NV' UNION
  SELECT 'New Hampshire', 'NH' UNION
  SELECT 'New Jersey', 'NJ' UNION
  SELECT 'New Mexico', 'NM' UNION
  SELECT 'New York', 'NY' UNION
  SELECT 'North Carolina', 'NC' UNION
  SELECT 'North Dakota', 'ND' UNION
  SELECT 'Ohio', 'OH' UNION
  SELECT 'Oklahoma', 'OK' UNION
  SELECT 'Oregon', 'OR' UNION
  SELECT 'Pennsylvania', 'PA' UNION
  SELECT 'Rhode Island', 'RI' UNION
  SELECT 'South Carolina', 'SC' UNION
  SELECT 'South Dakota', 'SD' UNION
  SELECT 'Tennessee', 'TN' UNION
  SELECT 'Texas', 'TX' UNION
  SELECT 'Utah', 'UT' UNION
  SELECT 'Vermont', 'VT' UNION
  SELECT 'Virginia', 'VA' UNION
  SELECT 'Washington', 'WA' UNION
  SELECT 'West Virginia', 'WV' UNION
  SELECT 'Wisconsin', 'WI' UNION
  SELECT 'Wyoming', 'WY' UNION
  SELECT 'District of Columbia', 'DC'
),
state_metrics AS (
  SELECT
    c.company_id,
    c.state,
    p.job_id,
    (s.min_salary + s.max_salary)/2 as avg_salary,
    ci.industry
  FROM companies c
  JOIN postings p ON c.company_id = p.company_id
  JOIN salary s ON p.job_id = s.job_id
  JOIN company_industries ci ON c.company_id = ci.company_id
  WHERE s.pay_period = 'YEARLY'
  AND c.state IS NOT NULL
)
SELECT
  COALESCE(sm.state_abbr, m.state) as state,
  COUNT(DISTINCT m.company_id) as num_companies,
  COUNT(DISTINCT m.job_id) as num_jobs,
  ROUND(AVG(m.avg_salary)) as avg_salary,
  STRING_AGG(DISTINCT m.industry, ', ' ORDER BY m.industry) as top_industries
FROM state_metrics m
LEFT JOIN state_mapping sm ON LOWER(m.state) = LOWER(sm.state_name)
GROUP BY COALESCE(sm.state_abbr, m.state)
HAVING COUNT(DISTINCT m.company_id) >= 5
ORDER BY num_jobs DESC`
            ).then(result => {
                cache.set('state_stats', result.rows);
                return result.rows;
            });
        },

        cacheIndustrySizeStats: function() {
            return pool.query(`
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
        END as size_category,
        ROUND(avg_employees) as rounded_avg_employees
      FROM industry_stats i
      WHERE company_count >= 5
      ORDER BY avg_employees DESC`
            ).then(result => {
                cache.set('industry_size_stats', result.rows);
                return result.rows;
            });
        },

  cleanup: function() {
    return pool.end().then(() => {
      cache.close();
    });
  }
};

module.exports = cacheManager;