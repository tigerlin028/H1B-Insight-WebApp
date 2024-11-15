const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

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

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
