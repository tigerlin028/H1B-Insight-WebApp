import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
          H1B Analysis
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/industry">Industry</Button>
          <Button color="inherit" component={Link} to="/companies">Companies</Button>
          <Button color="inherit" component={Link} to="/h1b">H1B Stats</Button>
          <Button color="inherit" component={Link} to="/jobs">Jobs</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;