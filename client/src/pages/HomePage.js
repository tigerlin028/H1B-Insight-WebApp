import React from 'react';
import { Container, Typography, Box, Grid, Paper, List, ListItem, ListItemText } from '@mui/material';

const sections = [
  {
    title: 'Industry',
    description: 'Discover which industries have higher H1B approval rates and get insights into employment trends.',
    path: '/industry'
  },
  {
    title: 'Company',
    description: 'Dive into company-level statistics, historical job postings, and H1B approval patterns.',
    path: '/companies'
  },
  {
    title: 'H1B Stats',
    description: 'Analyze H1B application volumes, approval rates, and demographic factors to guide your decisions.',
    path: '/h1b'
  },
  {
    title: 'Job',
    description: 'Search and filter for jobs based on location, salary ranges, and historical visa sponsorship likelihood.',
    path: '/jobs'
  }
];

const HomePage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          About
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ fontStyle: 'italic', fontWeight: 'bold' }}>
          "We Grade Companies to help H1B Holders make Informed Decisions!"
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ fontStyle: 'italic' }}>
          "In God we trust; all others must bring data."
          <br />
          — William Edwards Deming, American statistician, professor, author, lecturer, and consultant.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          CIS550 Group 52
        </Typography>
        <Typography variant="body1" paragraph>
          Team Members: Joyce Chen, Caitlyn Cui, Jiahua Liao, Xiaotian Lin
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Introduction
        </Typography>
        <Typography variant="body1" paragraph>
          Every year about 85,000 H1B Visas are given to internationals to work in America. Many of those internationals,
          who aspire to work in US, look for H1B Sponsors. Some of them are already in the US and trying to look for new jobs,
          change jobs, apply for Green Cards, etc. in companies that can sponsor H1B Visa for them.
        </Typography>

        <Typography variant="body1" paragraph>
          Most of the decisions taken today, by individuals to join a company or change to a new company, are based on the
          'branding' of the company and references. But, we believe that such decisions should be based on "Data". Our goal
          is to provide everyone a tool that grades companies based on various kinds of H1B related Data from various US
          government agencies like USCIS, US Department of Labor.
        </Typography>

        <Typography variant="body1" paragraph>
          Our goal is to provide everyone with H1B and other data in an interpretable way to make an informed decision as an
          H1B Visa Holder in US. We provide grades for companies based on their past Immigration, Wage, and Other Data.
          Our effort with this website is to provide you with:
        </Typography>

        <List sx={{ listStyleType: 'disc', pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Complete Statistics of a Company from filing H1B LCAs to H1B Approvals" />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Complete Wage Statistics of a Company for various Roles, cities" />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Company Grade focused on factors relevant for H1B Holders in US" />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Detailed Statistics on selected industries or companies based on search keywords" />
          </ListItem>

        </List>

        <Typography variant="body1" paragraph>
          Many more capabilities for you to make informed decision as an international professional to work in the US!
          Happy Searching!
        </Typography>
      </Box>


      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Project Description
        </Typography>
        <Typography variant="body1" paragraph>
          We are developing an application aiming to provide US Employment Insights for international employees
          using data from LinkedIn Job Postings and H1B Visa Statistics. The goal is to help international job
          seekers gain a better understanding of job opportunities and H1B visa sponsorship chances when exploring
          job postings.
        </Typography>
        <Typography variant="body1" paragraph>
          Main features of our website include:
        </Typography>
        <List sx={{ listStyleType: 'disc', pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Interactive visualizations of H1B lottery entries and high selection rates separated by industries, with information of individual company name, location, and salary range." />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Extensive statistics for a specific company with associated H1B data, and tables of previous listed job titles and descriptions, helping employees learn about potential opportunities for open positions." />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText primary="Customized filters for job search based on particular industries or companies names, provided with views across different fields in both ascending and descending orders." />
          </ListItem>
        </List>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Explore Our Sections
        </Typography>
        <Grid container spacing={2}>
          {sections.map((section) => (
            <Grid item xs={12} md={3} key={section.title}>
              <a 
                href={`http://localhost:3000${section.path}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Paper 
                  sx={{ 
                    p: 2,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.3s',
                    '&:hover': {
                      boxShadow: 6
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {section.title}
                  </Typography>
                  <Typography variant="body2">
                    {section.description}
                  </Typography>
                </Paper>
              </a>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;
