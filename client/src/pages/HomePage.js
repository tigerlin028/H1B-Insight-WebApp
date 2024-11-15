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

const HomePage = () => {
  const [topIndustries, setTopIndustries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('http://localhost:8080/h1b/industry-approval')
      .then(res => res.json())
      .then(data => {
        setTopIndustries(data.slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const chartData = {
    labels: topIndustries.map(item => item.industry),
    datasets: [{
      label: 'Approval Rate (%)',
      data: topIndustries.map(item => item.approval_rate),
      backgroundColor: '#990000',
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Industries by H1B Approval Rate'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Approval Rate (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Industry'
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        H1B Visa Application Analysis Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Industries by H1B Approval Rate
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar data={chartData} options={options} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Additional summary cards could be added here */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Industries
            </Typography>
            <Typography variant="h4">
              {topIndustries.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average Approval Rate
            </Typography>
            <Typography variant="h4">
              {topIndustries.length > 0 
                ? `${(topIndustries.reduce((acc, curr) => acc + curr.approval_rate, 0) / topIndustries.length).toFixed(1)}%`
                : '0%'
              }
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Top Industry
            </Typography>
            <Typography variant="h4">
              {topIndustries.length > 0 
                ? topIndustries[0].industry
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;