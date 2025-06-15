// src/components/Sidebar.jsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { NavLink } from 'react-router-dom';
import { teal } from '@mui/material/colors';

const drawerWidth = 180;

export default function Sidebar() {
  const navItems = [
    { text: 'Home', icon: <DashboardIcon sx={{ color: 'white' }} />, path: '/' },
    { text: 'News', icon: <NewspaperIcon sx={{ color: 'white' }} />, path: '/news' },
    { text: 'Financials', icon: <AccountBalanceIcon sx={{ color: 'white' }} />, path: '/Financials' },
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: teal[900], // Darker teal for sidebar background
          color: 'white',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'white' }}>
        
        
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              exact={item.path === '/'} // Use exact for home path
              sx={{
                '&.active': {
                  bgcolor: teal[600], // Highlight active link
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'white', // Ensure icon/text are white when active
                    fontWeight: 'bold',
                  },
                },
                '&:hover': {
                  bgcolor: teal[700], // Hover effect
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ color: 'white' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} /> {/* Pushes content to top */}
      <Box sx={{ p: 2, textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
        © 2025 EverGrow
      </Box>
    </Drawer>
  );
}