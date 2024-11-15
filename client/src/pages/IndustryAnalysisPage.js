import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const IndustryAnalysisPage = () => {
  const [salaryData, setSalaryData] = React.useState([]);
  const [sizeData, setSizeData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/industry/salary'),
      fetch('http://localhost:8080/industry/size-stats')
    ])
      .then(([salaryRes, sizeRes]) => 
        Promise.all([salaryRes.json(), sizeRes.json()])
      )
      .then(([salaryData, sizeData]) => {
        setSalaryData(salaryData);
        setSizeData(sizeData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const salaryChartData = {
    labels: salaryData.map(item => item.industry),
    datasets: [
      {
        label: 'Min Salary',
        data: salaryData.map(item => item.avg_min_salary),
        backgroundColor: '#990000',
      },
      {
        label: 'Max Salary',
        data: salaryData.map(item => item.avg_max_salary),
        backgroundColor: '#011F5B',
      }
    ]
  };

  const sizeChartData = {
    labels: sizeData.map(item => item.industry),
    datasets: [{
      label: 'Average Employees',
      data: sizeData.map(item => item.avg_employees),
      borderColor: '#990000',
      backgroundColor: '#990000',
      tension: 0.1,
      fill: false
    }]
  };

  const salaryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Industry Salary Distribution'
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
          text: 'Industry'
        }
      }
    }
  };

  const sizeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Industry Size Distribution'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Number of Employees'
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
        Industry Analysis
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Industry Salary Distribution
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Bar data={salaryChartData} options={salaryOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Industry Size Distribution
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Line data={sizeChartData} options={sizeOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average Industry Salary
            </Typography>
            <Typography variant="h4">
              {salaryData.length > 0 
                ? `$${Math.round(salaryData.reduce((acc, curr) => 
                    acc + (curr.avg_min_salary + curr.avg_max_salary) / 2, 0) / salaryData.length).toLocaleString()}`
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
              {sizeData.length > 0 
                ? Math.round(sizeData.reduce((acc, curr) => 
                    acc + curr.avg_employees, 0) / sizeData.length).toLocaleString()
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Industries Analyzed
            </Typography>
            <Typography variant="h4">
              {salaryData.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default IndustryAnalysisPage;