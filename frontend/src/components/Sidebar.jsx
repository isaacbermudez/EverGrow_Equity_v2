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
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RepeatIcon from '@mui/icons-material/Repeat';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
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
    { text: 'Home', icon: <DashboardIcon />, path: '/' },
    { text: 'News', icon: <NewspaperIcon />, path: '/news' },
    { text: 'Financials', icon: <AccountBalanceIcon />, path: '/financials' },
    { text: 'Transactions', icon: <RepeatIcon />, path: '/transactions' },
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1A1A1D 0%, #2D2D30 100%)',
          color: theme.palette.text.primary,
          border: 'none',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 188, 212, 0.5), transparent)',
            zIndex: 1,
          },
        },
      }}
      variant="permanent"
      anchor="left"
    >
      {/* Top Toolbar for the Bible Verse */}
      <Toolbar sx={{ position: 'relative', zIndex: 2 }}>
        <Typography
          variant="caption"
          noWrap={false}
          component="div"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            lineHeight: 1.4,
            textAlign: 'center',
            p: 1,
            background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 188, 212, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          "Mirad, y guardaos de toda avaricia;<br />porque la vida del hombre no consiste en la abundancia de los bienes que posee."<br />
          <span style={{
            fontSize: '0.7rem',
            display: 'block',
            marginTop: '8px',
            fontStyle: 'italic',
            color: theme.palette.primary.main,
            fontWeight: 600
          }}>
            — Lucas 12:15 (RV1960)
          </span>
        </Typography>
      </Toolbar>

      <Divider sx={{
        bgcolor: 'rgba(255, 255, 255, 0.06)',
        boxShadow: '0px 1px 0px rgba(0, 188, 212, 0.1)'
      }} />

      {/* Market Holidays Section */}
      <Box sx={{
        p: 1,
        my: 1,
        background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
        borderRadius: '16px',
        margin: '16px 12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
      }}>
        {loadingHolidays ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1 }}>
            <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Loading holidays...
            </Typography>
          </Box>
        ) : holidayError ? (
          <Alert
            severity="error"
            sx={{
              fontSize: '0.7rem',
              py: 0.5,
              px: 1,
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: theme.palette.error.main,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: theme.palette.error.main
              }
            }}
          >
            {holidayError}
          </Alert>
        ) : (
          <>
            {marketHolidays.length > 0 ? (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    display: 'block',
                    textAlign: 'center',
                    mb: 1,
                    fontSize: '0.85rem'
                  }}
                >
                  Market Holidays
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {marketHolidays.slice(0, 3).map((holiday, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        p: 0,
                        m: 0,
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 188, 212, 0.05)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <EventAvailableIcon
                          fontSize="small"
                          sx={{ color: theme.palette.primary.main }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              lineHeight: 1.3,
                              fontSize: '0.75rem'
                            }}
                          >
                            {holiday.eventName}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.primary.light,
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          >
                            {moment(holiday.atDate).format('MMM D, YYYY')}
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
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  No upcoming U.S. market holidays.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Portfolio Summary */}
      {isDataLoaded && (
        <Box sx={{
          p: 1,
          my: 1,
          background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
          borderRadius: '16px',
          margin: '16px 12px',
          border: '1px solid rgba(0, 188, 212, 0.2)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 188, 212, 0.6), transparent)',
          }
        }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              display: 'block',
              textAlign: 'center',
              mb: 1.5,
              fontSize: '0.85rem'
            }}
          >
            Portfolio Summary
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Total Value */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Box sx={{
                p: 0,
                borderRadius: '6px',
                background: 'rgba(0, 188, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={14} color={theme.palette.primary.main} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}>
                  {formatCurrency(totalValue)}
                </Typography>
              </Box>
            </Box>

            {/* Total P/L */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: `1px solid ${totalPL >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              <Box sx={{
                p: 0,
                borderRadius: '6px',
                background: totalPL >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalPL >= 0 ?
                  <TrendingUp size={14} color={theme.palette.success.main} /> :
                  <TrendingDown size={14} color={theme.palette.error.main} />
                }
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{
                    fontWeight: 700,
                    color: totalPL >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                  }}>
                    {`${totalPL >= 0 ? '+' : ''}${formatCurrency(totalPL)} `}
                    <Chip
                      label={`${safeNum(totalPLPct).toFixed(2)}%`}
                      size="small"
                      sx={{
                        height: '18px',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        backgroundColor: totalPL >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: totalPL >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        border: `1px solid ${totalPL >= 0 ? theme.palette.success.main : theme.palette.error.main}`,
                      }}
                    />
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Navigation List */}
      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              exact={String(item.path === '/')}
              sx={{
                borderRadius: '12px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: 'transparent',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '&.active': {
                  background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(156, 39, 176, 0.1) 100%)',
                  border: '1px solid rgba(0, 188, 212, 0.3)',
                  '&::before': {
                    background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 188, 212, 0.08)',
                  transform: 'translateX(4px)',
                  '&::before': {
                    background: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                  },
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: 40,
                color: theme.palette.text.secondary,
                transition: 'color 0.2s ease'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: theme.palette.text.secondary,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Data Management Section */}
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', my: 2 }} />

      <Box sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '16px',
        margin: '0 12px 16px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <FileUpload onUpload={onUploadAssets} isDataLoaded={isDataLoaded} isLoading={isLoading} />

        {isDataLoaded && (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', gap: 1 }}>
            <IconButton
              onClick={onRefreshData}
              disabled={isLoading}
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(0, 151, 167, 0.2) 100%)',
                color: theme.palette.primary.main,
                border: '1px solid rgba(0, 188, 212, 0.3)',
                borderRadius: '10px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.3) 0%, rgba(0, 151, 167, 0.3) 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0px 4px 12px rgba(0, 188, 212, 0.3)'
                },
                '&:disabled': {
                  opacity: 0.5,
                  transform: 'none'
                }
              }}
            >
              {isLoading ? (
                <CircularProgress
                  size={20}
                  sx={{ color: theme.palette.primary.main }}
                />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>

            <IconButton
              onClick={onClearData}
              sx={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                color: theme.palette.error.main,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0px 4px 12px rgba(239, 68, 68, 0.3)'
                }
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {/* Footer */}
      <Box sx={{
        p: 2,
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <Typography sx={{
          fontSize: '0.75rem',
          color: theme.palette.text.secondary,
          fontWeight: 500,
          background: 'linear-gradient(45deg, #00BCD4, #9C27B0)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          © 2025 EverGrow
        </Typography>
      </Box>
    </Drawer>
  );
}