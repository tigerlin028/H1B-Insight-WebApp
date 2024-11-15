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
        console.log('Raw API response:', data); // Debug log
        setTopIndustries(data.slice(0, 10));
        setLoading(false);
      })
      .catch(err => {
        console.error('API Error:', err);
        setLoading(false);
      });
  }, []);

  // Format industry names to be more concise
  const formatIndustryName = (name) => {
    if (!name) return 'N/A';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace('Manufacturing', 'Mfg.')
      .replace('Services', 'Svc.')
      .replace('Resources', 'Res.');
  };

  // Calculate average approval rate safely
  const calculateAverageApproval = (industries) => {
    if (!industries || industries.length === 0) return 0;
    
    const validIndustries = industries.filter(
      industry => industry.approval_rate != null && !isNaN(industry.approval_rate)
    );
    
    if (validIndustries.length === 0) return 0;
    
    console.log('Valid industries for average:', validIndustries); // Debug log
    const sum = validIndustries.reduce((acc, curr) => acc + Number(curr.approval_rate), 0);
    const average = (sum / validIndustries.length).toFixed(1);
    console.log('Calculated average:', average); // Debug log
    return average;
  };

  const chartData = {
    labels: topIndustries.map(item => formatIndustryName(item.industry)),
    datasets: [{
      label: 'Approval Rate',
      data: topIndustries.map(item => Number(item.approval_rate).toFixed(1)),
      backgroundColor: [
        '#990000',
        '#a61717',
        '#b32e2e',
        '#c04545',
        '#cc5c5c',
        '#d97373',
        '#e58a8a',
        '#f2a1a1',
        '#ffb8b8',
        '#ffcfcf',
      ],
      borderWidth: 1,
      borderRadius: 5,
      barThickness: 30,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Approval Rate: ${Number(context.raw).toFixed(1)}%`,
          title: (tooltipItems) => formatIndustryName(topIndustries[tooltipItems[0].dataIndex].industry)
        },
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
      },
      title: {
        display: true,
        text: 'Top Industries by H1B Approval Rate',
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
          font: {
            size: 12,
          },
          stepSize: 20,
        },
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        title: {
          display: true,
          text: 'Approval Rate (%)',
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: { top: 10, bottom: 10 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: 'Industry',
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: { top: 20, bottom: 0 },
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 10
      }
    },
  };

  const getTotalApplications = (industries) => {
    if (!industries || industries.length === 0) return 0;
    return industries.reduce((acc, curr) => acc + Number(curr.total_applications || 0), 0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              '& canvas': {
                maxHeight: '450px !important'
              }
            }}
          >
            <Box sx={{ height: 500, position: 'relative' }}>
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

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Total Industries
            </Typography>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
              {topIndustries.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Average Approval Rate
            </Typography>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
              {`${calculateAverageApproval(topIndustries)}%`}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Top Industry
            </Typography>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
              {topIndustries.length > 0 
                ? formatIndustryName(topIndustries[0].industry)
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