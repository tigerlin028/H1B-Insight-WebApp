import React, { useState, useEffect } from 'react';
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
import { Bar, Line, Pie } from 'react-chartjs-2';

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

const CompanyAnalysisPage = () => {
  const [companyStats, setCompanyStats] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [h1bTrends, setH1bTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/companies/detailed-stats'),
      fetch('http://localhost:8080/companies/salary-distribution'),
      fetch('http://localhost:8080/companies/h1b-trends')
    ])
      .then(([statsRes, salaryRes, trendsRes]) => {
        if (!statsRes.ok) throw new Error(`Stats API error: ${statsRes.status}`);
        if (!salaryRes.ok) throw new Error(`Salary API error: ${salaryRes.status}`);
        if (!trendsRes.ok) throw new Error(`Trends API error: ${trendsRes.status}`);
        
        return Promise.all([statsRes.json(), salaryRes.json(), trendsRes.json()]);
      })
      .then(([statsData, salaryData, trendsData]) => {
        setCompanyStats(statsData);
        setSalaryData(salaryData);
        setH1bTrends(trendsData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  // Get top 10 companies by salary
  const topSalaryCompanies = salaryData
    .sort((a, b) => b.avg_max_salary - a.avg_max_salary)
    .slice(0, 10);

  // Get top 10 companies by h1b applications
  const topH1BCompanies = companyStats
    .sort((a, b) => b.total_h1b_applications - a.total_h1b_applications)
    .slice(0, 10);

  const salaryChartData = {
    labels: topSalaryCompanies.map(item => item.company_name),
    datasets: [
      {
        label: 'Min Salary',
        data: topSalaryCompanies.map(item => item.avg_min_salary),
        backgroundColor: '#990000',
      },
      {
        label: 'Max Salary',
        data: topSalaryCompanies.map(item => item.avg_max_salary),
        backgroundColor: '#011F5B',
      }
    ]
  };

  const h1bChartData = {
    labels: topH1BCompanies.map(item => item.company_name),
    datasets: [{
      label: 'Total H1B Applications',
      data: topH1BCompanies.map(item => item.total_h1b_applications),
      borderColor: '#990000',
      backgroundColor: '#990000',
      tension: 0.1
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
        text: 'Top 10 Companies by Salary Range'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Salary ($)'
        },
        ticks: {
          callback: value => '$' + value.toLocaleString()
        }
      },
      x: {
        title: {
          display: true,
          text: 'Company'
        }
      }
    }
  };

  const h1bOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 Companies by H1B Applications'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Applications'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Company'
        }
      }
    }
  };

  const columns = [
    { field: 'company_name', headerName: 'Company', flex: 1 },
    { field: 'industry', headerName: 'Industry', flex: 1 },
    { 
      field: 'tier',
      headerName: 'Company Tier',
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
      field: 'total_h1b_applications', 
      headerName: 'H1B Applications',
      flex: 1,
      type: 'number',
      valueFormatter: (params) => params.value ? Number(params.value).toLocaleString() : '0'
    },
    { 
      field: 'h1b_approval_rate', 
      headerName: 'H1B Approval Rate',
      flex: 1,
      valueFormatter: (params) => params.value ? `${params.value}%` : '0%'
    },
    { 
      field: 'avg_max_salary', 
      headerName: 'Avg Max Salary',
      flex: 1,
      valueFormatter: (params) => params.value > 0 ? `$${params.value.toLocaleString()}` : 'Insufficient Data'
    },
    { 
      field: 'employee_count', 
      headerName: 'Employees',
      flex: 1,
      valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
    }
  ];

  const rows = companyStats.map((item) => ({
    id: item.company_id,
    ...item
  }));
  const filteredRows = rows.filter(row => 
    row.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Company Analysis
      </Typography>

      <Grid container spacing={3}>

        {/* Salary Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Companies by Salary Range
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

        {/* H1B Applications Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Companies by H1B Applications
            </Typography>
            <Box sx={{ height: 400, position: 'relative' }}>
              {loading ? (
                <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
                  Loading data...
                </Typography>
              ) : (
                <Line data={h1bChartData} options={h1bOptions} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average H1B Approval Rate
            </Typography>
            <Typography variant="h4">
              {companyStats.length > 0
                ? `${Math.round(
                    companyStats.reduce((acc, curr) => acc + Number(curr.h1b_approval_rate || 0), 0) / 
                    companyStats.filter(company => company.h1b_approval_rate != null).length
                  )}%`
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Average Salary Range
            </Typography>
            <Typography variant="h4">
              {salaryData.length > 0
                ? `$${Math.round(
                    salaryData.reduce((acc, curr) => 
                      acc + (Number(curr.avg_min_salary || 0) + Number(curr.avg_max_salary || 0)) / 2, 0
                    ) / salaryData.length
                  ).toLocaleString()}`
                : 'N/A'
              }
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Companies Analyzed
            </Typography>
            <Typography variant="h4">
              {companyStats.length}
            </Typography>
          </Paper>
        </Grid>


        {/* Company Details Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3}}>
            <Typography variant="h6" gutterBottom>
              Detailed Company Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Explore company-specific H1B metrics, including application numbers,
              approval rates, salary ranges, and employee counts.
            </Typography>

            {/* Search Input */}
            <TextField
              fullWidth
              sx={{ mb: 2 }}
              label="Search by Company or Industry"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter company or industry name..."
            />
            <Box sx={{ width: '100%', height: 650 }}>
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
                  No matching companies found
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CompanyAnalysisPage;