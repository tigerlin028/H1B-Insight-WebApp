import React from 'react';
import { Container, Typography, Grid, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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

// Helper function to format large numbers into readable strings
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

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/h1b/nationality-stats'),
      fetch('http://localhost:8080/h1b/gender-stats')
    ])
      .then(([nationalityRes, genderRes]) =>
        Promise.all([nationalityRes.json(), genderRes.json()])
      )
      .then(([nationalityData, genderData]) => {
        setNationalityStats(nationalityData.slice(0, 10)); // Top 10 countries
        setGenderStats(genderData);
        // Debugging logs
        const totalApps = nationalityData.reduce((acc, curr) => acc + Number(curr.total_applications || 0), 0);
        const totalApproved = nationalityData.reduce((acc, curr) => acc + Number(curr.approved_applications || 0), 0);

        console.log('Total Applications:', totalApps);
        console.log('Total Approved Applications:', totalApproved);
        console.log('Nationality Stats:', nationalityData);
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

  // Sort arrays for separate charts:
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
      },
    },
  };

  // Calculate overall approval rate from the top 10 countries
  const totalApps = nationalityStats.reduce((acc, curr) => acc + Number(curr.total_applications || 0), 0);
  const totalApproved = nationalityStats.reduce((acc, curr) => acc + Number(curr.approved_applications || 0), 0);
  const overallApprovalRate = totalApps > 0 ? ((totalApproved / totalApps) * 100).toFixed(1) : 'N/A';

  const totalAppsFormatted = totalApps > 0 ? formatLargeNumber(totalApps) : 'N/A';

<Typography variant="h4">
  {totalAppsFormatted}
</Typography>

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        H1B Visa Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Industry-Specific H1B Dashboard Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Industry-Specific H1B Lottery Selection Rates and Demographics
            </Typography>
            {industryLoading ? (
              <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                Loading industry data...
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Industry</TableCell>
                      <TableCell align="right">Total Applications</TableCell>
                      <TableCell align="right">Approved Applications</TableCell>
                      <TableCell align="right">Approval Rate (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {industryApprovalStats.map((row) => {
                        const approvalRate = row.approval_rate ? parseFloat(row.approval_rate) : null;

                    return (
                    <TableRow key={row.industry}>
                        <TableCell>{row.industry}</TableCell>
                    <TableCell align="right">{row.total_applications?.toLocaleString() || 'N/A'}</TableCell>
                       <TableCell align="right">{row.approved_applications?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell align="right">
                        {approvalRate !== null && Number.isFinite(approvalRate)
                        ? `${approvalRate.toFixed(1)}%`
                        : 'N/A'}
                </TableCell>
      </TableRow>
    );
  })}
</TableBody>

                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Two separate charts */}
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

        {/* Gender Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
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

        {/* Gender Approval Rates */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gender Approval Rates
            </Typography>
            <Box sx={{ p: 2 }}>
              {genderStats.map(stat => {
                const approvalRate = stat.approval_rate ? parseFloat(stat.approval_rate) : null;
                const totalApplications = stat.total_applications || 0;

                return (
                  <Box key={stat.gender} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{stat.gender}</Typography>
                    <Typography
                      variant="h6"
                      color={approvalRate >= 75 ? 'success.main' : 'inherit'}
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
            <Typography variant="h6" gutterBottom>
              Total Applications (Top 10 Countries)
            </Typography>
            <Typography variant="h4">{totalAppsFormatted}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
  <Paper sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" gutterBottom>
      Overall Approval Rate (Top 10 Countries)
    </Typography>
    <Typography variant="h4">
      {overallApprovalRate !== 'N/A' ? `${overallApprovalRate}%` : 'N/A'}
    </Typography>
  </Paper>
</Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Top Country (by Applications)
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
