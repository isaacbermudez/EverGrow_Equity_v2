// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
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
  Alert,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RepeatIcon from '@mui/icons-material/Repeat';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { teal } from '@mui/material/colors'; // Only keep teal since red/grey are not directly used here.
import moment from 'moment-timezone';
import { NavLink } from 'react-router-dom';
import FileUpload from './FileUpload';

// Constants for frontend local storage caching (still useful for immediate client-side refreshes)
const MARKET_HOLIDAYS_CLIENT_CACHE_KEY = 'marketHolidaysClientCache';
const CLIENT_CACHE_TTL_HOURS = 1; // Shorter client-side cache TTL, backend has longer Redis cache

export default function Sidebar({
  drawerWidth = 100,
  isDataLoaded,
  onUploadAssets,
  onClearData,
  onRefreshData,
  isLoading
}) {
  const theme = useTheme();

  const [marketHolidays, setMarketHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidayError, setHolidayError] = useState(null);

  useEffect(() => {
    const fetchAndFilterMarketHolidays = async () => { // Renamed for clarity
      setLoadingHolidays(true);
      setHolidayError(null);

      const now = moment();
      const oneMonthLater = moment().add(1, 'month');

      // Helper function to filter and sort holidays
      const filterAndSortHolidays = (holidays) => {
        return (Array.isArray(holidays) ? holidays : [])
          .filter(holiday => {
            const holidayDate = moment(holiday.atDate);
            // Keep holidays that are today or in the future AND within the next month
            return holidayDate.isSameOrAfter(now, 'day') && holidayDate.isSameOrBefore(oneMonthLater, 'day');
          })
          .sort((a, b) => moment(a.atDate).valueOf() - moment(b.atDate).valueOf());
      };

      // 1. Try to load from CLIENT-SIDE localStorage first
      const cachedData = localStorage.getItem(MARKET_HOLIDAYS_CLIENT_CACHE_KEY);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const cachedMoment = moment(timestamp);

          // Check if client-side cache is fresh
          if (now.diff(cachedMoment, 'hours') < CLIENT_CACHE_TTL_HOURS) {
            // Apply filtering and sorting to cached data
            const processedCachedHolidays = filterAndSortHolidays(data);
            setMarketHolidays(processedCachedHolidays);
            setLoadingHolidays(false);
            return; // Exit as we've used cached data
          }
        } catch (e) {
          console.warn("Error parsing or using client-side cached market holidays, fetching fresh data:", e);
          localStorage.removeItem(MARKET_HOLIDAYS_CLIENT_CACHE_KEY); // Clear invalid cache
        }
      }

      // 2. If no fresh client-side cache, fetch from BACKEND API
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

        // Apply filtering and sorting to fetched holidays
        const processedHolidays = filterAndSortHolidays(holidaysData);
        setMarketHolidays(processedHolidays);

        // Store the new data in client-side localStorage with a timestamp
        localStorage.setItem(MARKET_HOLIDAYS_CLIENT_CACHE_KEY, JSON.stringify({
          data: processedHolidays, // Store the processed data
          timestamp: now.toISOString()
        }));

      } catch (err) {
        console.error("Error fetching market holidays:", err);
        setHolidayError(`Market holidays unavailable: ${err.message}`);
        setMarketHolidays([]); // Ensure holidays are empty array on error
      } finally {
        setLoadingHolidays(false);
      }
    };

    fetchAndFilterMarketHolidays(); // Call the renamed function

    // Set up a shorter interval for client-side re-fetch to ensure data is reasonably fresh
    // The backend's Redis cache will handle the heavy lifting of API calls.
    const intervalId = setInterval(fetchAndFilterMarketHolidays, CLIENT_CACHE_TTL_HOURS * 60 * 60 * 1000);
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
                  {/* Slice to show only the first 3 holidays, as before */}
                  {marketHolidays.slice(0, 3).map((holiday, index) => (
                    <ListItem key={index} sx={{ p: 0, m: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24, color: 'white' }}> {/* Adjusted minWidth for smaller sidebar icons */}
                        <EventAvailableIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>
                            {holiday.eventName} ({moment(holiday.atDate).format('MMM D,YYYY')})
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
