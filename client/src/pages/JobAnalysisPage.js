import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js';
import { Bar, Bubble } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend,
);

const PENN_RED = '#990000';
const PENN_BLUE = '#011F5B';

const JobAnalysisDashboard = () => {
  const [jobData, setJobData] = React.useState([]);
  const [stateData, setStateData] = React.useState([]);

  React.useEffect(() => {
    fetch('http://localhost:8080/companies/salary-distribution')
      .then(res => res.json())
      .then(data => {
        setJobData(data);
      })
      .catch(err => {
        console.error(err);
      });
    fetch('http://localhost:8080/company/state-stats')
      .then(res => res.json())
      .then(data => {
        setStateData(data);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  // Existing data transformation functions
  const getJobDistributionData = () => {
    const companyData = jobData
      .sort((a, b) => parseInt(b.job_count) - parseInt(a.job_count))
      .slice(0, 15);

    return {
      labels: companyData.map(item => item.company_name),
      datasets: [
        {
          label: 'Number of Job Openings',
          data: companyData.map(item => parseInt(item.job_count)),
          backgroundColor: PENN_RED,
        },
        {
          label: 'Average Salary',
          data: companyData.map(item => 
            (parseInt(item.avg_min_salary) + parseInt(item.avg_max_salary)) / 2
          ),
          yAxisID: 'y2',
          backgroundColor: PENN_BLUE,
        }
      ]
    };
  };

  const getStateDistributionData = () => {
    // Return empty data structure if stateData is not an array
    if (!Array.isArray(stateData) || stateData.length === 0) {
        return {
            labels: [],
            datasets: [
                {
                    label: 'Number of Jobs',
                    data: [],
                    backgroundColor: PENN_RED,
                },
                {
                    label: 'Average Salary',
                    data: [],
                    yAxisID: 'y2',
                    backgroundColor: PENN_BLUE,
                }
            ]
        };
    }

    const sortedStateData = [...stateData]
        .sort((a, b) => parseInt(b.num_jobs) - parseInt(a.num_jobs))
        .slice(0, 15);

    return {
        labels: sortedStateData.map(item => item.state),
        datasets: [
            {
                label: 'Number of Jobs',
                data: sortedStateData.map(item => parseInt(item.num_jobs)),
                backgroundColor: PENN_RED,
            },
            {
                label: 'Average Salary',
                data: sortedStateData.map(item => parseInt(item.avg_salary)),
                yAxisID: 'y2',
                backgroundColor: PENN_BLUE,
            }
        ]
    };
};

  const getJobsByCompanySizeData = () => ({
    datasets: [{
      label: 'Companies',
      data: jobData.map(item => ({
        x: item.employee_count,
        y: parseInt(item.job_count),
        r: Math.min(Math.max(
          (parseInt(item.avg_max_salary) - parseInt(item.avg_min_salary)) / 5000, 
          5
        ), 20),
        company: item.company_name,
        industry: item.industry,
        salary_range: `$${parseInt(item.avg_min_salary).toLocaleString()} - $${parseInt(item.avg_max_salary).toLocaleString()}`
      })),
      backgroundColor: `${PENN_RED}99`,
    }]
  });

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Jobs'
        }
      },
      y2: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Average Salary ($)'
        }
      }
    }
  };

  const stateChartOptions = {
    ...chartOptions,
    plugins: {
      tooltip: {
        callbacks: {
          afterBody: (tooltipItems) => {
            const dataIndex = tooltipItems[0].dataIndex;
            const state = stateData[dataIndex];
            return [
              '',
              `Companies: ${state.num_companies}`,
              `Industries: ${state.top_industries}`
            ];
          }
        }
      }
    }
  };

  const scatterOptions = {
    scales: {
      x: {
        type: 'logarithmic',
        title: {
          display: true,
          text: 'Company Size (Employees)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Job Openings'
        },
        beginAtZero: true
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw;
            return [
              `Company: ${data.company}`,
              `Industry: ${data.industry}`,
              `Job Openings: ${data.y}`,
              `Salary Range: ${data.salary_range}`,
              `Employees: ${data.x.toLocaleString()}`
            ];
          }
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Job Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Existing summary cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
              Total Job Openings
            </Typography>
            <Typography variant="h4" sx={{ color: PENN_RED, fontSize: '2.5rem' }}>
              {jobData.reduce((acc, item) => 
                acc + parseInt(item.job_count), 0
              ).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
              Average Jobs per Company
            </Typography>
            <Typography variant="h4" sx={{ color: PENN_RED, fontSize: '2.5rem' }}>
              {Math.round(jobData.reduce((acc, item) => 
                acc + parseInt(item.job_count), 0
              ) / jobData.length).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
              Hiring Companies
            </Typography>
            <Typography variant="h4" sx={{ color: PENN_RED, fontSize: '2.5rem' }}>
              {jobData.length.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* New State Distribution Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', mb: 2 }}>
              Top States by Job Openings
            </Typography>
            <Box sx={{ height: 600 }}>
              <Bar 
                data={getStateDistributionData()} 
                options={{
                  ...stateChartOptions,
                  maintainAspectRatio: false
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Existing charts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', mb: 2 }}>
              Top Hiring Companies
            </Typography>
            <Box sx={{ height: 600 }}>
              <Bar 
                data={getJobDistributionData()} 
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', mb: 2 }}>
              Company Size vs. Job Openings
            </Typography>
            <Box sx={{ height: 660 }}>
              <Bubble 
                data={getJobsByCompanySizeData()} 
                options={{
                  ...scatterOptions,
                  maintainAspectRatio: false
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default JobAnalysisDashboard;