import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h5" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Face the Reality
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/industry">
            Industry
          </Button>
          <Button color="inherit" component={Link} to="/companies">
            Companies
          </Button>
          <Button color="inherit" component={Link} to="/h1b">
            H1B Stats
          </Button>
          <Button color="inherit" component={Link} to="/jobs">
            Jobs
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;