// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
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
  CircularProgress,
  Alert, // Added Alert for holiday errors
  useTheme // Added useTheme for theming
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RepeatIcon from '@mui/icons-material/Repeat';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; // Added for holiday icon
import { teal, red, grey } from '@mui/material/colors'; // Keeping original color imports for consistency, even if red/grey aren't used here.
import moment from 'moment-timezone'; // Used for date formatting in holidays
import { NavLink } from 'react-router-dom';
import FileUpload from './FileUpload';

export default function Sidebar({
  drawerWidth = 100,
  isDataLoaded,
  onUploadAssets,
  onClearData,
  onRefreshData,
  isLoading
}) {
  const theme = useTheme(); // Initialize useTheme hook

  // State for Market Holidays
  const [marketHolidays, setMarketHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true); // Renamed to avoid prop conflict
  const [holidayError, setHolidayError] = useState(null);

  useEffect(() => {
    const fetchMarketHolidays = async () => {
      setLoadingHolidays(true);
      setHolidayError(null);

      try {
        const holidaysResponse = await fetch('/api/market-holidays?exchange=US');
        if (!holidaysResponse.ok) {
          const errorText = await holidaysResponse.text();
          throw new Error(`Market Holidays API failed (${holidaysResponse.status}): ${errorText.substring(0, 100)}...`);
        }
        const holidaysData = await holidaysResponse.json();
        if (holidaysData.error) {
          throw new Error(`Market Holidays API error: ${holidaysData.error}`);
        }
        setMarketHolidays(Array.isArray(holidaysData) ? holidaysData : []);
      } catch (err) {
        console.error("Error fetching market holidays:", err);
        setHolidayError(`Market holidays unavailable: ${err.message}`);
        setMarketHolidays([]); // Ensure holidays are empty array on error
      } finally {
        setLoadingHolidays(false);
      }
    };

    fetchMarketHolidays();

    // Holidays don't need frequent refresh as they are fixed, but keep a long interval
    const intervalId = setInterval(fetchMarketHolidays, 24 * 60 * 60 * 1000); // Check once a day
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const navItems = [
    { text: 'Home', icon: <DashboardIcon sx={{ color: 'white' }} />, path: '/' },
    { text: 'News', icon: <NewspaperIcon sx={{ color: 'white' }} />, path: '/news' },
    { text: 'Financials', icon: <AccountBalanceIcon sx={{ color: 'white' }} />, path: '/financials' },
    { text: 'Transactions', icon: <RepeatIcon sx={{ color: 'white' }} />, path: '/transactions' },
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
          display: 'flex', // Enable flexbox for column layout
          flexDirection: 'column', // Stack children vertically
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
            fontSize: '0.8rem',
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

      {/* Market Holidays Section (moved here) */}
      <Box sx={{ p: 1, my: 1 }}> {/* Reduced padding/margin for sidebar integration */}
        {loadingHolidays ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1 }}>
            <CircularProgress size={16} color="primary" sx={{ color: 'rgba(255,255,255,0.7)' }} />
            <Typography variant="caption" color="text.secondary" sx={{ color: 'rgba(255,255,255,0.7)' }}>Loading holidays...</Typography>
          </Box>
        ) : holidayError ? (
          <Alert severity="error" sx={{ fontSize: '0.7rem', py: 0.5, px: 1, bgcolor: 'rgba(255, 99, 71, 0.2)', color: 'white' }}>
            {holidayError}
          </Alert>
        ) : (
          <>
            {marketHolidays.length > 0 ? (
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'block', textAlign: 'center', mb: 0.5 }}>
                  Upcoming U.S. Market Holidays:
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {marketHolidays.slice(0, 3).map((holiday, index) => (
                    <ListItem key={index} sx={{ p: 0, m: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24, color: 'white' }}> {/* Adjusted minWidth for smaller sidebar icons */}
                        <EventAvailableIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
                            {holiday.eventName} ({moment(holiday.atDate).format('MMM D, YYYY')})
                          </Typography>
                        }
                        sx={{ my: 0 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Box sx={{ py: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  No upcoming U.S. market holidays.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

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
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>

        <FileUpload onUpload={onUploadAssets} isDataLoaded={isDataLoaded} isLoading={isLoading} />

        {isDataLoaded && (
          <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', mt: 0.5 }}>
            <IconButton
              onClick={onRefreshData}
              disabled={isLoading}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: teal[700] },
                position: 'relative',
              }}
            >
              {isLoading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              ) : (
                <RefreshIcon />
              )}
              {!isLoading && (
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

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2, textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
        © 2025 EverGrow
      </Box>
    </Drawer>
  );
}
