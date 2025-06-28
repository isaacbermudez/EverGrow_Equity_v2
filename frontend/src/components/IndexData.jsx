// src/components/FredDataDisplay.jsx (IndexData Component)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Typography, CircularProgress, Paper, Divider } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

// Define a cache duration for FRED data in milliseconds for the frontend (e.g., 5 minutes)
const FRED_FRONTEND_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function IndexData() {
  const [fredData, setFredData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRangeFilter, setTimeRangeFilter] = useState('YTD');

  useEffect(() => {
    const FRED_LOCAL_CACHE_KEY = 'frontendFredDataCache';

    const loadDataFromLocalCache = () => {
      try {
        const cached = localStorage.getItem(FRED_LOCAL_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = new Date().getTime();
          // Check if cache is still fresh based on FRED_FRONTEND_CACHE_TTL
          if (now - timestamp < FRED_FRONTEND_CACHE_TTL) {
            setFredData(data);
            setLoading(false);
            return true; // Data loaded from local cache
          } else {
            localStorage.removeItem(FRED_LOCAL_CACHE_KEY); // Clear expired cache
          }
        }
      } catch (e) {
        console.error("Failed to load FRED data from localStorage or cache corrupted:", e);
        localStorage.removeItem(FRED_LOCAL_CACHE_KEY); // Clear potentially corrupted cache
      }
      return false; // Data not loaded from local cache or was expired/corrupted
    };

    const fetchAndCacheFredData = async () => {
      setLoading(true);
      setError(null);
      try {
        // This fetch call will hit your backend, which uses Redis for caching.
        const response = await fetch('/api/fred-data?series_ids=SP500,NASDAQ100');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch FRED data');
        }
        setFredData(data);
        // Store the fresh data in localStorage with a timestamp
        localStorage.setItem(FRED_LOCAL_CACHE_KEY, JSON.stringify({ data: data, timestamp: new Date().getTime() }));
      } catch (err) {
        console.error("Error fetching FRED data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // On component mount, first try to load from frontend cache
    const loadedFromLocalCache = loadDataFromLocalCache();

    // If not loaded from local cache (or cache was stale/empty), then proceed to fetch from backend
    if (!loadedFromLocalCache) {
      fetchAndCacheFredData();
    }

    // Set up an interval to refresh data regularly. This will always fetch from the backend
    // and update the frontend cache, ensuring data stays reasonably fresh.
    const interval = setInterval(fetchAndCacheFredData, FRED_FRONTEND_CACHE_TTL);
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []); // Empty dependency array means this runs once on mount

  const getStartDate = useCallback((filter) => {
    const today = new Date();
    switch (filter) {
      case 'YTD': return new Date(today.getFullYear(), 0, 1);
      case '5Y': return new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      case 'MTD': return new Date(today.getFullYear(), today.getMonth(), 1);
      case 'ALL':
      default: return null;
    }
  }, []);

  const getLatestValue = useCallback((seriesId) => {
    if (fredData?.[seriesId]?.latest_observations) {
      const observations = fredData[seriesId].latest_observations;
      const latestDate = Object.keys(observations).sort().pop();
      const value = observations[latestDate];
      return value !== null && value !== undefined ? value : null;
    }
    return null;
  }, [fredData]);

  const { filteredData, sp500Domain, nasdaq100Domain, sp500Change, sp500PercentageChange, nasdaq100Change, nasdaq100PercentageChange, initialValues } = useMemo(() => {
    if (!fredData?.SP500?.full_data || !fredData?.NASDAQ100?.full_data) {
      return {
        filteredData: [], sp500Domain: ['auto', 'auto'], nasdaq100Domain: ['auto', 'auto'],
        sp500Change: null, sp500PercentageChange: null, nasdaq100Change: null, nasdaq100PercentageChange: null,
        initialValues: { SP500: null, NASDAQ100: null }
      };
    }

    const sp500FullData = fredData.SP500.full_data;
    const nasdaq100FullData = fredData.NASDAQ100.full_data;
    const combinedData = {};

    Object.keys(sp500FullData).forEach(dateStr => {
      const dateKey = dateStr.split(' ')[0];
      if (!combinedData[dateKey]) combinedData[dateKey] = { date: dateKey };
      combinedData[dateKey].SP500 = sp500FullData[dateStr];
    });

    Object.keys(nasdaq100FullData).forEach(dateStr => {
      const dateKey = dateStr.split(' ')[0];
      if (!combinedData[dateKey]) combinedData[dateKey] = { date: dateKey };
      combinedData[dateKey].NASDAQ100 = nasdaq100FullData[dateStr];
    });

    let dataArray = Object.values(combinedData)
      .filter(d => d.SP500 !== null || d.NASDAQ100 !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const startDateFilter = getStartDate(timeRangeFilter);
    let initialSP500Value = null, initialNASDAQ100Value = null;

    if (startDateFilter) {
      const filteredArray = dataArray.filter(d => new Date(d.date) >= startDateFilter);
      if (filteredArray.length > 0) {
        // Find the first non-null value within the filtered range for initial calculation
        initialSP500Value = filteredArray.find(d => d.SP500 !== null)?.SP500 || null;
        initialNASDAQ100Value = filteredArray.find(d => d.NASDAQ100 !== null)?.NASDAQ100 || null;
      }
      dataArray = filteredArray;
    } else {
      // For 'ALL' filter, find the very first non-null value in the entire dataset
      initialSP500Value = dataArray.find(d => d.SP500 !== null)?.SP500 || null;
      initialNASDAQ100Value = dataArray.find(d => d.NASDAQ100 !== null)?.NASDAQ100 || null;
    }

    const sp500Values = dataArray.filter(d => d.SP500 !== null).map(d => d.SP500);
    const nasdaq100Values = dataArray.filter(d => d.NASDAQ100 !== null).map(d => d.NASDAQ100);

    const getDomain = (values) => {
      if (values.length === 0) return ['auto', 'auto'];
      const min = Math.min(...values), max = Math.max(...values);
      const padding = (max - min) * 0.05;
      let domain = [min - padding, max + padding]; // Allow negative if values go below 0
      if (domain[0] === domain[1]) { // Handle flat line data
        domain[0] = domain[0] * 0.99;
        domain[1] = domain[1] * 1.01;
      }
      return domain;
    };

    const finalSP500Domain = getDomain(sp500Values);
    const finalNASDAQ100Domain = getDomain(nasdaq100Values);

    const latestSP500 = getLatestValue('SP500');
    const latestNASDAQ100 = getLatestValue('NASDAQ100');

    const sp500Chg = (latestSP500 !== null && initialSP500Value !== null) ? latestSP500 - initialSP500Value : null;
    const sp500PctChg = (sp500Chg !== null && initialSP500Value !== null && initialSP500Value !== 0) ? (sp500Chg / initialSP500Value) * 100 : null;

    const nasdaq100Chg = (latestNASDAQ100 !== null && initialNASDAQ100Value !== null) ? latestNASDAQ100 - initialNASDAQ100Value : null;
    const nasdaq100PctChg = (nasdaq100Chg !== null && initialNASDAQ100Value !== null && initialNASDAQ100Value !== 0) ? (nasdaq100Chg / initialNASDAQ100Value) * 100 : null;

    return {
      filteredData: dataArray, sp500Domain: finalSP500Domain, nasdaq100Domain: finalNASDAQ100Domain,
      sp500Change: sp500Chg, sp500PercentageChange: sp500PctChg, nasdaq100Change: nasdaq100Chg, nasdaq100PercentageChange: nasdaq100PctChg,
      initialValues: { SP500: initialSP500Value, NASDAQ100: initialNASDAQ100Value }
    };
  }, [fredData, timeRangeFilter, getStartDate, getLatestValue]);

  const formatChange = (change, percentageChange) => {
    if (change === null || percentageChange === null) {
      return <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>--</Typography>;
    }
    const isPositive = change >= 0;
    const color = isPositive ? '#00C49F' : '#FF6347';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <Icon size={16} style={{ marginRight: 4, color }} />
        <Typography variant="body2" sx={{ color, fontWeight: 500 }}>
          {Math.abs(change).toFixed(2)} ({Math.abs(percentageChange).toFixed(2)}%)
        </Typography>
      </Box>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const sp500Data = payload.find(p => p.dataKey === 'SP500');
    const nasdaq100Data = payload.find(p => p.dataKey === 'NASDAQ100');
    
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    });

    const calculateChange = (currentValue, initialValue) => {
      if (!currentValue || !initialValue) return { change: null, percentage: null };
      const change = currentValue - initialValue;
      return { change, percentage: (change / initialValue) * 100 };
    };

    const formatValue = (value) => value?.toLocaleString(undefined, { 
      minimumFractionDigits: 2, maximumFractionDigits: 2 
    });

    const renderChangeText = (change, percentage) => {
      if (change === null || percentage === null) return null;
      const isPositive = change >= 0;
      const color = isPositive ? '#00C49F' : '#FF6347';
      const sign = isPositive ? '+' : '';
      return (
        <Typography variant="body2" sx={{ color, fontSize: '0.75rem', mt: 0.5 }}>
          {sign}{change.toFixed(2)} ({sign}{percentage.toFixed(2)}%) since {timeRangeFilter}
        </Typography>
      );
    };

    return (
      <Box sx={{
        backgroundColor: 'rgba(20, 20, 20, 0.95)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px', p: 2, color: 'white', minWidth: 220,
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)'
      }}>
        <Typography variant="body2" sx={{ 
          color: '#00C49F', fontWeight: 'bold', mb: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1
        }}>
          {formatDate(label)}
        </Typography>
        
        {sp500Data && sp500Data.value !== null && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#0088FE', fontWeight: 'medium' }}>S&P 500:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${formatValue(sp500Data.value)}</Typography>
            </Box>
            {initialValues.SP500 && (() => {
              const { change, percentage } = calculateChange(sp500Data.value, initialValues.SP500);
              return renderChangeText(change, percentage);
            })()}
          </Box>
        )}
        
        {nasdaq100Data && nasdaq100Data.value !== null && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#FFBB28', fontWeight: 'medium' }}>NASDAQ 100:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${formatValue(nasdaq100Data.value)}</Typography>
            </Box>
            {initialValues.NASDAQ100 && (() => {
              const { change, percentage } = calculateChange(nasdaq100Data.value, initialValues.NASDAQ100);
              return renderChangeText(change, percentage);
            })()}
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, mb: 4, width: '100%', minHeight: '200px' }}>
        <CircularProgress size={24} sx={{ color: 'white' }} />
        <Typography variant="body2" sx={{ ml: 2, color: 'rgba(255,255,255,0.7)' }}>
          Loading market index data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, mb: 4, borderRadius: 2, bgcolor: 'rgba(255, 99, 71, 0.2)', width: '100%', textAlign: 'center' }}>
        <Typography variant="body2" color="error">Error loading market data: {error}</Typography>
      </Box>
    );
  }

  const latestSP500 = getLatestValue('SP500');
  const latestNASDAQ100 = getLatestValue('NASDAQ100');

  return (
    <Paper elevation={6} sx={{
      p: 2, mb: 3, borderRadius: 3,
      background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(50, 50, 50, 0.9) 100%)',
      color: 'white', width: '100%', maxWidth: '1200px', mx: 'auto',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 2, transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: 'translateY(-3px)' }
    }}>
      {/* Header and Current Values */}
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', alignItems: 'center',
        width: '100%', gap: 2, mb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BarChart3 size={24} color="#00C49F" />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#00C49F' }}>Market Indices</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>S&P 500</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DollarSign size={16} style={{ marginRight: 4 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {latestSP500 !== null ? latestSP500.toFixed(2) : 'N/A'}
                </Typography>
              </Box>
              {formatChange(sp500Change, sp500PercentageChange)}
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>NASDAQ 100</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DollarSign size={16} style={{ marginRight: 4 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {latestNASDAQ100 !== null ? latestNASDAQ100.toFixed(2) : 'N/A'}
                </Typography>
              </Box>
              {formatChange(nasdaq100Change, nasdaq100PercentageChange)}
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ width: '90%', borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />

      {/* Time Range Filter */}
      <ToggleButtonGroup
        color="primary" value={timeRangeFilter} exclusive
        onChange={(e, newValue) => newValue && setTimeRangeFilter(newValue)}
        size="small" sx={{
          mb: 2,
          '& .MuiToggleButton-root': {
            color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease',
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.8) 0%, rgba(156, 39, 176, 0.8) 100%)',
              color: 'white', boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)',
              borderColor: 'rgba(0, 188, 212, 0.5)'
            },
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }
        }}
      >
        <ToggleButton value="YTD">YTD</ToggleButton>
        <ToggleButton value="MTD">MTD</ToggleButton>
        <ToggleButton value="5Y">5Y</ToggleButton>
        <ToggleButton value="ALL">All</ToggleButton>
      </ToggleButtonGroup>

      {/* Chart */}
      <Box sx={{ width: '100%', height: 300 }}>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                minTickGap={30} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => value !== null && value !== undefined ? `$${(value / 1000).toFixed(0)}K` : ''}
                stroke="#0088FE" domain={sp500Domain} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => value !== null && value !== undefined ? `$${(value / 1000).toFixed(0)}K` : ''}
                stroke="#FFBB28" domain={nasdaq100Domain} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'white', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="SP500" stroke="#0088FE" 
                strokeWidth={['5Y', 'ALL'].includes(timeRangeFilter) ? 2 : 3}
                dot={false} activeDot={{ r: 6, fill: '#0088FE', strokeWidth: 2, stroke: '#fff' }}
                name="S&P 500" connectNulls={false} />
              <Line yAxisId="right" type="monotone" dataKey="NASDAQ100" stroke="#FFBB28" 
                strokeWidth={['5Y', 'ALL'].includes(timeRangeFilter) ? 2 : 3}
                dot={false} activeDot={{ r: 6, fill: '#FFBB28', strokeWidth: 2, stroke: '#fff' }}
                name="NASDAQ 100" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No historical data available for charting.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
