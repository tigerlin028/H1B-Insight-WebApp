const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const cacheManager = require('./cacheManager');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
connectDB();
app.use(cors({
  origin: '*',
}));
app.use(express.json());

// API endpoints
app.get('/h1b/industry-approval', routes.industryApproval);
app.get('/industry/salary', routes.industrySalary);
app.get('/company/size-stats', routes.companySizeStats);
app.get('/h1b/nationality-stats', routes.nationalityStats);
app.get('/jobs/remote-stats', routes.remoteWorkStats);
app.get('/jobs/level-stats', routes.jobLevelStats);
app.get('/company/tier-stats', routes.companyTierStats);
app.get('/h1b/gender-stats', routes.genderStats);
app.get('/company/state-stats', routes.stateStats);
app.get('/industry/size-stats', routes.industrySizeStats);
app.get('/companies/detailed-stats', routes.companyDetailedStats);
app.get('/companies/salary-distribution', routes.companySalaryDistribution);
app.get('/companies/h1b-trends', routes.companyH1BTrends);

app.use('/api/auth', authRoutes);

const server = app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`);
  cacheManager.initCache()
    .then(() => console.log('Cache initialized successfully'))
    .catch(err => console.error('Failed to initialize cache:', err));
});

process.on('SIGTERM', () => {
  cacheManager.cleanup()
    .then(() => server.close());
});

process.on('SIGINT', () => {
  cacheManager.cleanup()
    .then(() => server.close());
});

module.exports = app;