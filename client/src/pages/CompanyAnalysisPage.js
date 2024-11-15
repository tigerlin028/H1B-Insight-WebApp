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
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CompanyAnalysisPage = () => {
  const [sizeStats, setSizeStats] = React.useState([]);
  const [tierStats, setTierStats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/company/size-stats'),
      fetch('http://localhost:8080/company/tier-stats')
    ])
      .then(([sizeRes, tierRes]) => 
        Promise.all([sizeRes.json(), tierRes.json()])
      )
      .then(([sizeData, tierData]) => {
        setSizeStats(sizeData);
        setTierStats(tierData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const sizeChartData = {
    labels: sizeStats.map(item => item.size_category),
    datasets: [{
      data: sizeStats.map(item => item.company_count),
      backgroundColor: [
        '#990000',
        '#011F5B',
        '#666666',
        '#999999'
      ],
      borderColor: '#FFFFFF',
      borderWidth: 1
    }]
  };

  const tierChartData = {
    labels: tierStats.map(item => item.company_size),
    datasets: [
      {
        label: 'Average Max Salary',
        data: tierStats.map(item => item.avg_max_salary),
        backgroundColor: '#990000',
      },
      {
        label: 'H1B Approval Rate (%)',
        data: tierStats.map(item => item.h1b_approval_rate),
        backgroundColor: '#011F5B',
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Company Size Distribution'
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Company Performance by Size'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        title: {
          display: true,
          text: 'Value'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Company Size'
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Company Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Company Size Distribution
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Pie data={sizeChartData} options={pieOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Company Performance Metrics
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar data={tierChartData} options={barOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Companies
            </Typography>
            <Typography variant="h4">
              {sizeStats.reduce((acc, curr) => acc + curr.company_count, 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average H1B Approval Rate
            </Typography>
            <Typography variant="h4">
              {tierStats.length > 0 
                ? `${(tierStats.reduce((acc, curr) => acc + curr.h1b_approval_rate, 0) / tierStats.length).toFixed(1)}%`
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average Company Size
            </Typography>
            <Typography variant="h4">
              {sizeStats.length > 0 
                ? Math.round(sizeStats.reduce((acc, curr) => 
                    acc + (curr.company_count * parseInt(curr.size_category)), 0) / 
                    sizeStats.reduce((acc, curr) => acc + curr.company_count, 0)).toLocaleString()
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CompanyAnalysisPage;