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
  Box,
  IconButton,
  CircularProgress, // Import CircularProgress for loading indicator
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RepeatIcon from '@mui/icons-material/Repeat';
// New imports for the moved functionality
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import FileUpload from './FileUpload'; // Import FileUpload component

import { NavLink } from 'react-router-dom';
import { teal } from '@mui/material/colors';

export default function Sidebar({
  drawerWidth = 100,
  isDataLoaded,
  onUploadAssets,
  onClearData,
  onRefreshData,
  isLoading
}) {
  const navItems = [
    { text: 'Home', icon: <DashboardIcon sx={{ color: 'white' }} />, path: '/' },
    { text: 'News', icon: <NewspaperIcon sx={{ color: 'white' }} />, path: '/news' },
    { text: 'Financials', icon: <AccountBalanceIcon sx={{ color: 'white' }} />, path: '/financials' },
    { text: 'Transactions', icon: <RepeatIcon sx={{ color: 'white' }} />, path: '/transactions' },
    // { text: 'Wealth', icon: <FavoriteIcon sx={{ color: 'white' }} />, path: '/wealth' },
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: teal[900],
          color: 'white',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      {/* Top Toolbar for the Bible Verse */}
      <Toolbar>
        <Typography
          variant="caption"
          noWrap={false}
          component="div"
          sx={{
            fontWeight: 500,
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.8rem', // Slightly adjusted for compact sidebar
            lineHeight: 1.4,
            textAlign: 'center',
            p: 1
          }}
        >
          "Mirad, y guardaos de toda avaricia;<br />porque la vida del hombre no consiste en la abundancia de los bienes que posee."<br />
          <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
            — Lucas 12:15 (RV1960)
          </span>
        </Typography>
      </Toolbar>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

      {/* Navigation List */}
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              exact={item.path === '/'}
              sx={{
                '&.active': {
                  bgcolor: teal[600],
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'white',
                    fontWeight: 'bold',
                  },
                },
                '&:hover': {
                  bgcolor: teal[700],
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

      {/* New Section for Data Management (Upload, Refresh, Clear) */}
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} /> {/* Divider for separation */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>

        {/* FileUpload component now handles its own display based on isDataLoaded */}
        <FileUpload onUpload={onUploadAssets} isDataLoaded={isDataLoaded} isLoading={isLoading} />

        {isDataLoaded && (
          <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', mt: 0.5 }}>
            <IconButton
              onClick={onRefreshData}
              disabled={isLoading} // Disable button when loading
              sx={{
                color: 'white',
                '&:hover': { bgcolor: teal[700] },
                position: 'relative', // Needed for CircularProgress positioning
              }}
            >
              {isLoading ? ( // If loading, show spinner
                <CircularProgress
                  size={24} // Size of the spinner
                  sx={{
                    color: 'white',
                    position: 'absolute', // Position over the icon
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px', // Half of size to center vertically
                    marginLeft: '-12px', // Half of size to center horizontally
                  }}
                />
              ) : ( // If not loading, show refresh icon
                <RefreshIcon />
              )}
              {/* Conditionally render the "Refresh" text */}
              {!isLoading && ( // Show text ONLY if not loading
                <Typography variant="caption" sx={{ ml: 0.5, color: 'white' }}>
                  Refresh
                </Typography>
              )}
            </IconButton>
            <IconButton onClick={onClearData} sx={{ color: 'white', '&:hover': { bgcolor: teal[700] } }}>
              <ClearIcon />
              <Typography variant="caption" sx={{ ml: 0.5, color: 'white' }}>Clear</Typography>
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1 }} /> {/* Pushes content to top */}
      <Box sx={{ p: 2, textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
        © 2025 EverGrow
      </Box>
    </Drawer>
  );
}