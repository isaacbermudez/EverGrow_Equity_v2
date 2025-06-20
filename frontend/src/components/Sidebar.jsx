// src/components/Sidebar.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RepeatIcon from '@mui/icons-material/Repeat';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { teal } from '@mui/material/colors';
import moment from 'moment-timezone';
import { NavLink } from 'react-router-dom';
import FileUpload from './FileUpload';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

// Constants for frontend local storage caching
const MARKET_HOLIDAYS_CLIENT_CACHE_KEY = 'marketHolidaysClientCache';
const CLIENT_CACHE_TTL_HOURS = 1;

// Helper for safe number formatting
const safeNum = (n) => (typeof n === 'number' || typeof n === 'string' && !isNaN(parseFloat(n)) ? parseFloat(n) : 0);

// Helper to format currency
const formatCurrency = (amount) => {
  return `$${safeNum(amount).toFixed(2)}`;
};

export default function Sidebar({
  drawerWidth = 100,
  isDataLoaded,
  onUploadAssets,
  onClearData,
  onRefreshData,
  isLoading,
  assets = []
}) {
  const theme = useTheme();

  const [marketHolidays, setMarketHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidayError, setHolidayError] = useState(null);

  useEffect(() => {
    const fetchAndFilterMarketHolidays = async () => {
      setLoadingHolidays(true);
      setHolidayError(null);

      const now = moment();
      const oneMonthLater = moment().add(1, 'month');

      const filterAndSortHolidays = (holidays) => {
        return (Array.isArray(holidays) ? holidays : [])
          .filter(holiday => {
            const holidayDate = moment(holiday.atDate);
            return holidayDate.isSameOrAfter(now, 'day') && holidayDate.isSameOrBefore(oneMonthLater, 'day');
          })
          .sort((a, b) => moment(a.atDate).valueOf() - moment(b.atDate).valueOf());
      };

      const cachedData = localStorage.getItem(MARKET_HOLIDAYS_CLIENT_CACHE_KEY);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const cachedMoment = moment(timestamp);

          if (now.diff(cachedMoment, 'hours') < CLIENT_CACHE_TTL_HOURS) {
            const processedCachedHolidays = filterAndSortHolidays(data);
            setMarketHolidays(processedCachedHolidays);
            setLoadingHolidays(false);
            return;
          }
        } catch (e) {
          console.warn("Error parsing or using client-side cached market holidays, fetching fresh data:", e);
          localStorage.removeItem(MARKET_HOLIDAYS_CLIENT_CACHE_KEY);
        }
      }

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

        const processedHolidays = filterAndSortHolidays(holidaysData);
        setMarketHolidays(processedHolidays);

        localStorage.setItem(MARKET_HOLIDAYS_CLIENT_CACHE_KEY, JSON.stringify({
          data: processedHolidays,
          timestamp: now.toISOString()
        }));

      } catch (err) {
        console.error("Error fetching market holidays:", err);
        setHolidayError(`Market holidays unavailable: ${err.message}`);
        setMarketHolidays([]);
      } finally {
        setLoadingHolidays(false);
      }
    };

    fetchAndFilterMarketHolidays();
    const intervalId = setInterval(fetchAndFilterMarketHolidays, CLIENT_CACHE_TTL_HOURS * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Memoize calculations for portfolio summary
  const { totalValue, totalPL, totalPLPct } = useMemo(() => {
    let currentTotalValue = 0;
    let currentTotalPL = 0;
    let totalCostBasis = 0;

    assets.forEach(asset => {
      currentTotalValue += safeNum(asset.marketValue);
      currentTotalPL += safeNum(asset.profitLoss);
      totalCostBasis += safeNum(asset.CI);
    });

    const currentTotalPLPct = (totalCostBasis ? (currentTotalPL / totalCostBasis * 100) : 0) || 0;

    return {
      totalValue: currentTotalValue,
      totalPL: currentTotalPL,
      totalPLPct: currentTotalPLPct
    };
  }, [assets]);


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
          display: 'flex',
          flexDirection: 'column',
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

      {/* Market Holidays Section */}
      <Box sx={{ p: 1, my: 1 }}>
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
                Market Holidays:
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {marketHolidays.slice(0, 3).map((holiday, index) => (
                    <ListItem key={index} sx={{ p: 0, m: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24, color: 'white' }}>
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

      {/* NEW: Compact Portfolio Summary Labels in Sidebar */}
      {isDataLoaded && ( // Only show if data is loaded
        <Box sx={{ p: 1, my: 1, width: '100%', boxSizing: 'border-box' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'block', textAlign: 'center', mb: 0.5 }}>
            Portfolio Summary:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
              <DollarSign size={15} color={theme.palette.text.secondary} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1, fontSize: '0.68rem' }}>
                Total Value: <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.68rem' }}>{formatCurrency(totalValue)}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
              {totalPL >= 0 ? <TrendingUp size={15} color={theme.palette.success.main} /> : <TrendingDown size={15} color={theme.palette.error.main} />}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1, fontSize: '0.68rem' }}>
                Total P/L: <span style={{ fontWeight: 'bold', color: totalPL >= 0 ? theme.palette.success.main : theme.palette.error.main, fontSize: '0.68rem' }}>
                  {`${totalPL >= 0 ? '+' : ''}${formatCurrency(totalPL)}`}
                </span>
                <span style={{ color: totalPL >= 0 ? theme.palette.success.main : theme.palette.error.main, fontSize: '0.68rem' }}>
                  {` (${safeNum(totalPLPct).toFixed(2)}%)`}
                </span>
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

      {/* Navigation List */}
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              exact={String(item.path === '/')}
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
