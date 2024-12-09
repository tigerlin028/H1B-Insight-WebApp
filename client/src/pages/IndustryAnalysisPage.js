import React from 'react';
import { Container, Typography, Grid, Paper, Box, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
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
  const [tierStatsData, setTierStatsData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/industry/salary'),
      fetch('http://localhost:8080/industry/size-stats'),
      fetch('http://localhost:8080/company/tier-stats')
    ])
      .then(([salaryRes, sizeRes, tierStatsRes]) =>
        Promise.all([salaryRes.json(), sizeRes.json(), tierStatsRes.json()])
      )
      .then(([salaryData, sizeData, tierStatsData]) => {
        setSalaryData(salaryData);
        setSizeData(sizeData);
        setTierStatsData(tierStatsData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Sort and slice top 10 industries for salary and size
  const topSalaryData = salaryData
    .sort((a, b) => b.avg_max_salary - a.avg_max_salary) // Sort by max salary descending
    .slice(0, 10); // Get top 10

  const topSizeData = sizeData
    .sort((a, b) => b.avg_employees - a.avg_employees) // Sort by average employees descending
    .slice(0, 10); // Get top 10

  const salaryChartData = {
    labels: topSalaryData.map(item => item.industry),
    datasets: [
      {
        label: 'Min Salary',
        data: topSalaryData.map(item => item.avg_min_salary),
        backgroundColor: '#990000',
      },
      {
        label: 'Max Salary',
        data: topSalaryData.map(item => item.avg_max_salary),
        backgroundColor: '#011F5B',
      }
    ]
  };

  const sizeChartData = {
    labels: topSizeData.map(item => item.industry),
    datasets: [{
      label: 'Average Employees',
      data: topSizeData.map(item => item.avg_employees),
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
        text: 'Top 10 Industries by Salary'
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
        text: 'Top 10 Industries by Company Size'
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

  // Define columns for the DataGrid
  const columns = [
    { field: 'industry', headerName: 'Industry', flex: 1 },
    { 
      field: 'company_size', 
      headerName: 'Company Size', 
      flex: 1,
      renderCell: (params) => {
        const color = params.value === 'Enterprise' ? '#4CAF50' : 
                     params.value === 'SMB' ? '#FFC107' : '#FF5722';
        return (
          <Typography sx={{ color: color, fontWeight: 'bold' }}>
            {params.value}
          </Typography>
        );
      }
    },
    {
      field: 'company_count',
      headerName: 'Company Count',
      flex: 1,
      type: 'number',
      valueFormatter: (params) => params.value.toLocaleString()
    },
    {
      field: 'avg_employees',
      headerName: 'Avg Employees',
      flex: 1,
      type: 'number',
      valueFormatter: (params) => params.value.toLocaleString()
    },
    {
      field: 'total_jobs',
      headerName: 'Total Jobs',
      flex: 1,
      type: 'number',
      valueFormatter: (params) => params.value.toLocaleString()
    },
    {
      field: 'avg_max_salary',
      headerName: 'Avg Max Salary',
      flex: 1,
      valueFormatter: (params) => params.value ? `$${params.value.toLocaleString()}` : 'N/A'
    },
    {
      field: 'h1b_approval_rate',
      headerName: 'H1B Approval Rate (%)',
      flex: 1,
      valueFormatter: (params) => `${params.value}%`
    },
  ];

  // Convert tier stats data into DataGrid-compatible rows
  const rows = tierStatsData.map((item, index) => ({ id: index, ...item }));
  const filteredRows = rows.filter(row => 
    row.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Industry Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Salary Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Industries by Salary
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

        {/* Size Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Industries by Company Size
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
              ? `$${Math.round(
                  salaryData.reduce((acc, curr) => {
                    const avgSalary = (Number(curr.avg_min_salary || 0) + Number(curr.avg_max_salary || 0)) / 2;
                    return acc + avgSalary;
                  }, 0) / salaryData.length
                ).toLocaleString()}`
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
                  acc + Number(curr.avg_employees), 0) / sizeData.length).toLocaleString()
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

      {/* Industry Details Table */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Industry Information
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Explore industries-specific H1B metrics, including industry details, company sizes,
            salary averages, and approval rates.
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
          
          <Box sx={{ height: 650 }}>
            {loading ? (
              <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                Loading data...
              </Typography>
            ) : filteredRows.length > 0 ? (
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSize={10}
                disableSelectionOnClick
              />
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', pt: 4 }}>
                No matching industries found
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>


    </Container>
  );
};

export default IndustryAnalysisPage;