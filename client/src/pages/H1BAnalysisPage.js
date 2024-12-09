import React from 'react';
import { Container, Typography, Grid, Paper, Box, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format large numbers
function formatLargeNumber(num) {
  if (num < 1000) return num.toString();
  const units = ['K', 'M', 'B', 'T'];
  let unitIndex = -1;
  let reduced = num;
  while (reduced >= 1000 && unitIndex < units.length - 1) {
    reduced /= 1000;
    unitIndex++;
  }
  return `${reduced.toFixed(1)}${units[unitIndex]}`;
}

const H1BAnalysisPage = () => {
  const [nationalityStats, setNationalityStats] = React.useState([]);
  const [genderStats, setGenderStats] = React.useState([]);
  const [industryApprovalStats, setIndustryApprovalStats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [industryLoading, setIndustryLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/h1b/nationality-stats'),
      fetch('http://localhost:8080/h1b/gender-stats')
    ])
      .then(([nationalityRes, genderRes]) =>
        Promise.all([nationalityRes.json(), genderRes.json()])
      )
      .then(([nationalityData, genderData]) => {
        setNationalityStats(nationalityData.slice(0, 10));
        setGenderStats(genderData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    fetch('http://localhost:8080/h1b/industry-approval')
      .then(res => res.json())
      .then(data => {
        setIndustryApprovalStats(data);
        setIndustryLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIndustryLoading(false);
      });
  }, []);

  const industryColumns = [
    { field: 'industry', headerName: 'Industry', flex: 1 },
    { 
      field: 'total_applications', 
      headerName: 'Total Applications',
      flex: 1,
      type: 'number',
      valueFormatter: (params) => params.value.toLocaleString()
    },
    { 
      field: 'approved_applications', 
      headerName: 'Approved Applications',
      flex: 1,
      type: 'number',
      valueFormatter: (params) => params.value.toLocaleString()
    },
    {
      field: 'approval_rate',
      headerName: 'Approval Rate',
      flex: 1,
      valueFormatter: (params) => `${parseFloat(params.value).toFixed(1)}%`
    }
  ];

  // Sort arrays for separate charts
  const topByApplications = [...nationalityStats].sort((a, b) => b.total_applications - a.total_applications);
  const topByApprovalRate = [...nationalityStats].sort((a, b) => parseFloat(b.approval_rate) - parseFloat(a.approval_rate));

  const buildChartData = (dataArr) => ({
    labels: dataArr.map(item => item.country),
    datasets: [
      {
        label: 'Total Applications',
        data: dataArr.map(item => item.total_applications),
        backgroundColor: '#990000',
        yAxisID: 'y1',
      },
      {
        label: 'Approval Rate (%)',
        data: dataArr.map(item => parseFloat(item.approval_rate)),
        backgroundColor: '#011F5B',
        yAxisID: 'y2',
      },
    ],
  });

  const nationalityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Applications',
        },
      },
      y2: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Approval Rate (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Country',
        },
      },
    },
  };

  const genderChartData = {
    labels: genderStats.map(item => item.gender),
    datasets: [
      {
        data: genderStats.map(item => item.total_applications),
        backgroundColor: ['#990000', '#011F5B', '#666666'],
        borderColor: '#FFFFFF',
        borderWidth: 1,
      },
    ],
  };

  const genderOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Gender Distribution of H1B Applications',
      }
    },
    cutout: '50%' 
  };

  const filteredIndustryRows = industryApprovalStats
  .filter(row => 
    row.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .map((item, index) => ({
    id: index,
    ...item
  }));

  // Calculate overall stats
  const totalApps = nationalityStats.reduce((acc, curr) => acc + Number(curr.total_applications || 0), 0);
  const totalApproved = nationalityStats.reduce((acc, curr) => acc + Number(curr.approved_applications || 0), 0);
  const overallApprovalRate = totalApps > 0 ? ((totalApproved / totalApps) * 100).toFixed(1) : 'N/A';
  const totalAppsFormatted = totalApps > 0 ? formatLargeNumber(totalApps) : 'N/A';

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        H1B Visa Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Industry Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Industry-Specific H1B Lottery Selection Rates and Demographics
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Explore industry-specific H1B metrics, including application numbers,
              approval rates, and selection rates.
            </Typography>

            {/* Search Input */}
            <TextField
              fullWidth
              sx={{ mb: 2 }}
              label="Search by Industry"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter industry name..."
            />

            <Box sx={{ height: 600 }}>
              {industryLoading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading industry data...
                </Typography>
              ) : filteredIndustryRows.length > 0 ? (
                <DataGrid
                  rows={filteredIndustryRows}
                  columns={industryColumns}
                  pageSize={10}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f5f5f5',
                      borderBottom: 'none'
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0'
                    }
                  }}
                />
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', pt: 4 }}>
                  No matching industries found
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Country Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Countries by Total Applications
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar
                  data={buildChartData(topByApplications)}
                  options={{
                    ...nationalityChartOptions,
                    plugins: {
                      ...nationalityChartOptions.plugins,
                      title: {
                        display: true,
                        text: 'H1B Applications by Country (by Total Applications)',
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Countries by Approval Rate
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar
                  data={buildChartData(topByApprovalRate)}
                  options={{
                    ...nationalityChartOptions,
                    plugins: {
                      ...nationalityChartOptions.plugins,
                      title: {
                        display: true,
                        text: 'H1B Applications by Country (by Approval Rate)',
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Gender Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Pie data={genderChartData} options={genderOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height:'100%' }}>
            <Typography variant="h6" gutterBottom>
              Gender Approval Rates
            </Typography>
            <Box sx={{ 
              p: 2, 
              height: 350,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around'
            }}>
              {genderStats.map(stat => {
                const approvalRate = stat.approval_rate ? parseFloat(stat.approval_rate) : null;
                const totalApplications = stat.total_applications || 0;

                return (
                  <Box key={stat.gender} sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h4" 
                      sx={{ fontWeight: 'bold', mb: 2, fontSize:'2rem' }}
                    >
                      {stat.gender}
                    </Typography>
                    <Typography
                      variant="body1"
                      color={approvalRate >= 75 ? 'success.main' : 'inherit'}
                      sx={{ mb: 1 }}
                    >
                      Approval Rate: {approvalRate !== null ? `${approvalRate.toFixed(1)}%` : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Applications: {totalApplications > 0 ? totalApplications.toLocaleString() : 'N/A'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }} gutterBottom>
              Total Applications (Top 10)
            </Typography>
            <Typography variant="h4">
              {totalAppsFormatted}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }} gutterBottom>
              Overall Approval Rate (Top 10)
            </Typography>
            <Typography variant="h4">
              {overallApprovalRate !== 'N/A' ? `${overallApprovalRate}%` : 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }} gutterBottom>
              Top Country by Applications
            </Typography>
            <Typography variant="h4">
              {nationalityStats.length > 0 ? nationalityStats[0].country : 'N/A'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default H1BAnalysisPage;