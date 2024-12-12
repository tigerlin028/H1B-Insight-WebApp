import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from './auth/LoginModal';
import RegisterPage from './auth/RegisterModal';

const NavBar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
  };

  const handleRegisterSuccess = () => {
    setRegisterOpen(false);
  };

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
            fontWeight: 'bold',
          }}
        >
          Face the Reality
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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

          {isAuthenticated && user ? (
            <>
              <Typography sx={{ marginRight: 1, color: 'white' }}>
                {user.name}
              </Typography>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => setLoginOpen(true)}>
                Login
              </Button>
              <Button color="inherit" onClick={() => setRegisterOpen(true)}>
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      <LoginPage 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)} 
        onSuccess={handleLoginSuccess}
      />
      <RegisterPage 
        open={registerOpen} 
        onClose={() => setRegisterOpen(false)} 
        onSuccess={handleRegisterSuccess}
      />
    </AppBar>
  );
};

export default NavBar;