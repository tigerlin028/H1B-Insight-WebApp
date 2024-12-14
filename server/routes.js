const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const config = require('./config.json');
const cacheManager = require('./cacheManager');

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

const industryApproval = async function(req, res) {
  try {
    const data = await cacheManager.getIndustryApproval();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const industrySalary = async function(req, res) {
  try {
    const data = await cacheManager.getIndustrySalary();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const nationalityStats = async function(req, res) {
  try {
    const data = await cacheManager.getNationalityStats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const companyTierStats = async function(req, res) {
  try {
    const data = await cacheManager.getCompanyTierStats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const genderStats = async function(req, res) {
  try {
    const data = await cacheManager.getGenderStats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const stateStats = async function(req, res) {
  try {
    const data = await cacheManager.getStateStats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const industrySizeStats = async function(req, res) {
  try {
    const data = await cacheManager.getIndustrySizeStats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const companyDetailedStats = async function(req, res) {
  try {
    const data = await cacheManager.getCompanyStats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const companySalaryDistribution = async function(req, res) {
  try {
    const data = await cacheManager.getSalaryDistribution();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

const companyH1BTrends = async function(req, res) {
  try {
    const data = await cacheManager.getH1BTrends();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};

module.exports = {
  companyDetailedStats,
  industryApproval,
  industrySalary,
  nationalityStats,
  companyTierStats,
  genderStats,
  stateStats,
  industrySizeStats,
  companyDetailedStats,
  companyH1BTrends,
  companySalaryDistribution
};
