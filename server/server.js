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
app.get('/h1b/nationality-stats', routes.nationalityStats);
app.get('/company/tier-stats', routes.companyTierStats);
app.get('/h1b/gender-stats', routes.genderStats);
app.get('/company/state-stats', routes.stateStats);
app.get('/industry/size-stats', routes.industrySizeStats);
app.get('/companies/detailed-stats', routes.companyDetailedStats);
app.get('/companies/salary-distribution', routes.companySalaryDistribution);
app.get('/companies/h1b-trends', routes.companyH1BTrends);

app.use('/api/auth', authRoutes);
console.log('Auth routes mounted at /api/auth')

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

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