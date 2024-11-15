import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
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

const H1BAnalysisPage = () => {
  const [nationalityStats, setNationalityStats] = React.useState([]);
  const [genderStats, setGenderStats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const nationalityChartData = {
    labels: nationalityStats.map(item => item.country),
    datasets: [
      {
        label: 'Total Applications',
        data: nationalityStats.map(item => item.total_applications),
        backgroundColor: '#990000',
        yAxisID: 'y1',
      },
      {
        label: 'Approval Rate (%)',
        data: nationalityStats.map(item => item.approval_rate),
        backgroundColor: '#011F5B',
        yAxisID: 'y2',
      }
    ]
  };

  const genderChartData = {
    labels: genderStats.map(item => item.gender),
    datasets: [{
      data: genderStats.map(item => item.total_applications),
      backgroundColor: ['#990000', '#011F5B', '#666666'],
      borderColor: '#FFFFFF',
      borderWidth: 1
    }]
  };

  const nationalityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'H1B Applications by Country'
      }
    },
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Applications'
        }
      },
      y2: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Approval Rate (%)'
        },
        grid: {
          drawOnChartArea: false
        }
      },
      x: {
        title: {
          display: true,
          text: 'Country'
        }
      }
    }
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
        text: 'Gender Distribution of H1B Applications'
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        H1B Visa Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Countries by H1B Applications
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar data={nationalityChartData} options={nationalityOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

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

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gender Approval Rates
            </Typography>
            <Box sx={{ p: 2 }}>
              {genderStats.map(stat => (
                <Box key={stat.gender} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    {stat.gender}
                  </Typography>
                  <Typography variant="h6" color={stat.approval_rate >= 75 ? 'success.main' : 'inherit'}>
                    Approval Rate: {stat.approval_rate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications: {stat.total_applications.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Applications
            </Typography>
            <Typography variant="h4">
              {nationalityStats.reduce((acc, curr) => acc + curr.total_applications, 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Overall Approval Rate
            </Typography>
            <Typography variant="h4">
              {nationalityStats.length > 0
                ? `${(nationalityStats.reduce((acc, curr) => 
                    acc + (curr.approval_rate * curr.total_applications), 0) / 
                    nationalityStats.reduce((acc, curr) => acc + curr.total_applications, 0)).toFixed(1)}%`
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Top Country
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