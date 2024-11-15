import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const JobAnalysisPage = () => {
  const [remoteStats, setRemoteStats] = React.useState([]);
  const [levelStats, setLevelStats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/jobs/remote-stats'),
      fetch('http://localhost:8080/jobs/level-stats')
    ])
      .then(([remoteRes, levelRes]) => 
        Promise.all([remoteRes.json(), levelRes.json()])
      )
      .then(([remoteData, levelData]) => {
        setRemoteStats(remoteData);
        setLevelStats(levelData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const remoteChartData = {
    labels: remoteStats.map(item => item.work_arrangement),
    datasets: [
      {
        label: 'Total Applications',
        data: remoteStats.map(item => item.total_applications),
        backgroundColor: '#990000',
        yAxisID: 'y1',
      },
      {
        label: 'Approval Rate (%)',
        data: remoteStats.map(item => item.approval_rate),
        backgroundColor: '#011F5B',
        yAxisID: 'y2',
      }
    ]
  };

  const levelChartData = {
    labels: levelStats.map(item => item.seniority_level),
    datasets: [
      {
        label: 'Average Min Salary',
        data: levelStats.map(item => item.avg_min_salary),
        backgroundColor: '#990000',
      },
      {
        label: 'Average Max Salary',
        data: levelStats.map(item => item.avg_max_salary),
        backgroundColor: '#011F5B',
      }
    ]
  };

  const remoteOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Remote Work Analysis'
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
      }
    }
  };

  const levelOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Salary Range by Job Level'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Salary ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Job Level'
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Job Market Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Remote vs. On-site Work Analysis
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar data={remoteChartData} options={remoteOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Salary Distribution by Job Level
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar data={levelChartData} options={levelOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Remote Work Percentage
            </Typography>
            <Typography variant="h4">
              {remoteStats.length > 0 ? (
                `${(remoteStats.find(item => item.work_arrangement === 'Remote Allowed')?.total_applications / 
                  remoteStats.reduce((acc, curr) => acc + curr.total_applications, 0) * 100).toFixed(1)}%`
              ) : 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average Salary Range
            </Typography>
            <Typography variant="h4">
              {levelStats.length > 0 ? (
                `$${Math.round(levelStats.reduce((acc, curr) => 
                  acc + curr.avg_salary_range, 0) / levelStats.length).toLocaleString()}`
              ) : 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Most Common Level
            </Typography>
            <Typography variant="h4">
              {levelStats.length > 0 ? 
                levelStats.reduce((prev, curr) => 
                  prev.job_count > curr.job_count ? prev : curr
                ).seniority_level : 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        {/* Additional Analysis Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Level Breakdown
            </Typography>
            <Grid container spacing={2}>
              {levelStats.map(level => (
                <Grid item xs={12} md={4} key={level.seniority_level}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {level.seniority_level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Job Count: {level.job_count.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Salary Range: ${level.avg_min_salary.toLocaleString()} - ${level.avg_max_salary.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default JobAnalysisPage;