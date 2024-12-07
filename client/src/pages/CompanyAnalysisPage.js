import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const CompanyDashboardPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetching data from /company/tier-stats endpoint as an example
    // Once you have a dedicated endpoint returning historical job titles,
    // descriptions, and visa info, update this fetch call accordingly.
    fetch('http://localhost:8080/company/tier-stats')
      .then(response => response.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching company data:', error);
        setLoading(false);
      });
  }, []);

  // Define columns based on the data returned by /company/tier-stats
  // Adjust these to reflect actual fields once you have the H1B historical endpoint
  const columns = [
    { field: 'industry', headerName: 'Industry', flex: 1 },
    { field: 'company_size', headerName: 'Company Size', flex: 1 },
    { field: 'company_count', headerName: 'Company Count', flex: 1 },
    { field: 'avg_followers', headerName: 'Avg Followers', flex: 1 },
    { field: 'avg_employees', headerName: 'Avg Employees', flex: 1 },
    { field: 'total_jobs', headerName: 'Total Jobs', flex: 1 },
    { field: 'avg_max_salary', headerName: 'Avg Max Salary', flex: 1 },
    { field: 'h1b_approval_rate', headerName: 'H1B Approval Rate (%)', flex: 1 },
  ];

  // Convert data from API into DataGrid-compatible rows
  // Assign a unique 'id' for each row
  const rows = data.map((item, index) => ({ id: index, ...item }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Company Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Explore company-specific H1B metrics, including industry details, company sizes,
        salary averages, and approval rates.
      </Typography>

      <Paper sx={{ height: 600, p: 3 }}>
        {loading ? (
          <Typography variant="h6" sx={{ textAlign: 'center', pt: 8 }}>
            Loading data...
          </Typography>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        )}
      </Paper>
    </Container>
  );
};

export default CompanyDashboardPage;
