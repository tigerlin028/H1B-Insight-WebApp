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
    return this.warmCache();
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
      this.cacheCompanySizeStats(),
      this.cacheNationalityStats(),
      this.cacheRemoteWorkStats(),
      this.cacheJobLevelStats(),
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

  getCompanySizeStats: function() {
    let data = cache.get('company_size_stats');
    if (!data) {
      return this.cacheCompanySizeStats();
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

  getRemoteWorkStats: function() {
    let data = cache.get('remote_work_stats');
    if (!data) {
      return this.cacheRemoteWorkStats();
    }
    return Promise.resolve(data);
  },

  getJobLevelStats: function() {
    let data = cache.get('job_level_stats');
    if (!data) {
      return this.cacheJobLevelStats();
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
      WITH company_h1b_metrics AS (
        SELECT 
          matched_company_id,
          COUNT(*) as total_apps,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as approved_apps
        FROM h1b 
        WHERE matched_company_id IS NOT NULL 
        AND status IS NOT NULL
        GROUP BY matched_company_id
      )
      SELECT 
        c.company_id,
        c.name as company_name,
        ci.industry,
        ec.employee_count,
        hm.total_apps as total_h1b_applications,
        hm.approved_apps as approved_h1b_applications,
        ROUND((hm.approved_apps::DECIMAL * 100.0) / NULLIF(hm.total_apps, 0), 2) as h1b_approval_rate
      FROM companies c
      JOIN company_industries ci ON c.company_id = ci.company_id
      JOIN employee_counts ec ON c.company_id = ec.company_id
      JOIN company_h1b_metrics hm ON c.company_id = hm.matched_company_id
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
                WITH h1b_aggs AS (
        SELECT 
          matched_company_id,
          COUNT(*) as total_apps,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as approved_apps
        FROM h1b 
        WHERE matched_company_id IS NOT NULL 
        AND status IS NOT NULL
        GROUP BY matched_company_id
      )
      SELECT 
        ci.industry,
        SUM(h.total_apps) as total_applications,
        SUM(h.approved_apps) as approved_applications,
        ROUND(
          CASE 
            WHEN SUM(h.total_apps) > 0 THEN 
              (SUM(h.approved_apps)::DECIMAL * 100.0) / SUM(h.total_apps)
            ELSE 0 
          END, 
          2
        ) as approval_rate
      FROM h1b_aggs h
      JOIN companies c ON h.matched_company_id = c.company_id
      JOIN company_industries ci ON c.company_id = ci.company_id
      WHERE ci.industry IS NOT NULL
      GROUP BY ci.industry
      HAVING SUM(h.total_apps) >= 5
      ORDER BY approval_rate DESC`
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

        cacheCompanySizeStats: function() {
            return pool.query(`
                WITH company_metrics AS (
        SELECT 
          c.company_id,
          ci.industry,
          CASE
            WHEN ec.employee_count < 100 THEN 'Small (<100)'
            WHEN ec.employee_count < 1000 THEN 'Medium (100-999)'
            WHEN ec.employee_count < 10000 THEN 'Large (1000-9999)'
            ELSE 'Huge (10000+)'
          END as size_category,
          COUNT(*) OVER (PARTITION BY h.matched_company_id) as company_apps,
          SUM(CASE WHEN h.status = 1 THEN 1 ELSE 0 END) OVER (PARTITION BY h.matched_company_id) as company_approvals
        FROM companies c
        JOIN employee_counts ec ON c.company_id = ec.company_id
        JOIN company_industries ci ON c.company_id = ci.company_id
        LEFT JOIN h1b h ON c.company_id = h.matched_company_id
        WHERE h.matched_company_id IS NOT NULL
      )
      SELECT
        size_category,
        industry,
        COUNT(DISTINCT company_id) as companies_count,
        SUM(company_apps) as total_applications,
        ROUND(AVG(company_approvals::DECIMAL / NULLIF(company_apps, 0)) * 100, 2) as approval_rate
      FROM company_metrics
      GROUP BY size_category, industry
      HAVING COUNT(DISTINCT company_id) >= 5
      ORDER BY size_category, approval_rate DESC`
            ).then(result => {
                cache.set('company_size_stats', result.rows);
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

        cacheRemoteWorkStats: function() {
            return pool.query(`
                WITH remote_metrics AS (
        SELECT
          CASE
            WHEN p.remote_allowed = 1 THEN 'Remote Allowed'
            ELSE 'Not Specified'
          END as work_arrangement,
          h.status,
          (s.min_salary + s.max_salary)/2 as avg_salary,
          p.company_id
        FROM h1b h
        JOIN postings p ON h.matched_company_id = p.company_id
        JOIN salary s ON p.job_id = s.job_id
        WHERE s.pay_period = 'YEARLY'
      )
      SELECT
        work_arrangement,
        COUNT(*) as total_applications,
        ROUND(AVG(CASE WHEN status = 1 THEN 1 ELSE 0 END) * 100, 2) as approval_rate,
        ROUND(AVG(avg_salary)) as avg_salary,
        COUNT(DISTINCT company_id) as unique_companies
      FROM remote_metrics
      GROUP BY work_arrangement
      ORDER BY total_applications DESC`
            ).then(result => {
                cache.set('remote_work_stats', result.rows);
                return result.rows;
            });
        },

        cacheJobLevelStats: function() {
            return pool.query(`
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
        AND s.min_salary > 0
        AND s.max_salary < 1000000
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
      ORDER BY seniority_level, job_count DESC`
            ).then(result => {
                cache.set('job_level_stats', result.rows);
                return result.rows;
            });
        },

        cacheCompanyTierStats: function() {
            return pool.query(`
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
      LEFT JOIN h1b h ON p.company_id = h.matched_company_id
      WHERE s.pay_period = 'YEARLY'
      GROUP BY ct.industry, ct.company_size
      HAVING COUNT(DISTINCT ct.company_id) >= 5
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
                WITH state_metrics AS (
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
        state,
        COUNT(DISTINCT company_id) as num_companies,
        COUNT(DISTINCT job_id) as num_jobs,
        ROUND(AVG(avg_salary)) as avg_salary,
        STRING_AGG(DISTINCT industry, ', ' ORDER BY industry) as top_industries
      FROM state_metrics
      GROUP BY state
      HAVING COUNT(DISTINCT company_id) >= 5
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
          AVG(ec.employee_count) as avg_employees,
          AVG(ec.follower_count) as avg_followers
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
        ROUND(avg_followers) as rounded_avg_followers,
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