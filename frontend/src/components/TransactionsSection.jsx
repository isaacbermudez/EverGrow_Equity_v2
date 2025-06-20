// src/components/TransactionsSection.jsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Tabs,
  Tab,
  IconButton, // For sort icons
  TextField, // For ticker filter input
  InputAdornment, // For search icon in text field
  ToggleButton, // For operation filter
  ToggleButtonGroup, // For operation filter
  Chip, // For operation chip in table
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList, Area } from 'recharts'; // Added LabelList, Area
import { DollarSign, Repeat, ArrowUp, ArrowDown, Search } from 'lucide-react'; // Changed ArrowUpward to ArrowUp, ArrowDownward to ArrowDown
import moment from 'moment';
import { teal } from '@mui/material/colors';

// Helper for safe number formatting
const safeNum = (n) => (typeof n === 'number' || (typeof n === 'string' && !isNaN(parseFloat(n))) ? parseFloat(n) : 0);

// Helper to format currency
const formatCurrency = (amount) => {
  return `$${safeNum(amount).toFixed(2)}`;
};

// Helper for date formatting for display
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return moment.utc(dateString).format('YYYY-MM-DD');
  } catch (e) {
    console.error("Error parsing date:", dateString, e);
    return dateString;
  }
};

// Custom Table Header Cell component with sorting
const SortableTableCell = ({ children, orderBy, orderDirection, property, onRequestSort, theme, align = 'left' }) => {
  const isSorted = orderBy === property;
  return (
    <TableCell
      align={align}
      sortDirection={isSorted ? orderDirection : false}
      sx={{
        fontWeight: 700,
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        fontSize: '0.875rem',
        padding: '16px 12px', // Default padding
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        cursor: 'pointer', // Indicate sortability
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }}
      onClick={() => onRequestSort(property)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {children}
        {isSorted ? (
          orderDirection === 'desc' ? <ArrowDown style={{ fontSize: 16, marginLeft: 4 }} /> : <ArrowUp style={{ fontSize: 16, marginLeft: 4 }} /> // Changed icons here
        ) : (
          <ArrowUp style={{ fontSize: 16, marginLeft: 4, opacity: 0.3 }} /> // Neutral sort icon
        )}
      </Box>
    </TableCell>
  );
};


export default function TransactionsSection({ transactions = [] }) {
  // DEBUG LOG: What data is received by this component?
  console.log("TransactionsSection: Received transactions prop:", transactions);

  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  // State for sorting
  const [orderBy, setOrderBy] = useState('Date'); // Default sort by Date
  const [orderDirection, setOrderDirection] = useState('desc'); // Default descending

  // State for filtering
  const [operationFilter, setOperationFilter] = useState('All'); // 'All', 'Buy', 'Sell'
  const [tickerFilter, setTickerFilter] = useState(''); // Text search for Ticker


  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOperationFilterChange = (event, newFilter) => {
    // Only update filter if a new value is selected (prevents toggling off)
    if (newFilter !== null) {
      setOperationFilter(newFilter);
    }
  };

  const handleTickerFilterChange = (event) => {
    setTickerFilter(event.target.value);
  };

  // Memoized calculations for transaction summaries and filtered/sorted transactions
  const {
    // Global summary metrics (calculated from ALL transactions)
    totalTransactions,
    totalAmountInvested,
    totalBuyTransactions,
    totalSellTransactions,
    totalBuyAmount,
    totalSellAmount,

    // Data for charts (derived from FILTERED transactions)
    tickerInvestmentSummary,
    monthlyTransactionCountData,
    monthlyInvestmentAmountData,

    // Data for table (filtered and sorted)
    filteredAndSortedTransactions,
  } = useMemo(() => {
    // 1. Calculate global totals from ALL transactions (for Average Metrics section)
    let allTotalTrans = transactions.length;
    let allTotalInvested = 0;
    let allTotalBuyTrans = 0;
    let allTotalSellTrans = 0;
    let allTotalBuyAmt = 0;
    let allTotalSellAmt = 0;

    transactions.forEach(t => {
      const amountInvested = safeNum(t.Total_Invested);
      allTotalInvested += amountInvested;
      if (t.Ops === 'Buy') {
        allTotalBuyTrans += 1;
        allTotalBuyAmt += amountInvested;
      } else if (t.Ops === 'Sell') {
        allTotalSellTrans += 1;
        allTotalSellAmt += amountInvested;
      }
    });

    // 2. Apply Filters to create the base for charts and table
    const filteredBaseTransactions = transactions.filter(t => {
      const matchesOperation = operationFilter === 'All' || (t.Ops && t.Ops.toLowerCase() === operationFilter.toLowerCase());
      const matchesTicker = tickerFilter === '' || (t.Ticker && t.Ticker.toLowerCase().includes(tickerFilter.toLowerCase()));
      return matchesOperation && matchesTicker;
    });

    // 3. Prepare data for charts from filteredBaseTransactions
    const currentTickerInvestments = {};
    const currentMonthlyTransactionCounts = {};
    const currentMonthlyInvestments = {};

    filteredBaseTransactions.forEach(t => {
      const amountInvested = safeNum(t.Total_Invested);
      const ticker = t.Ticker || 'N/A';
      currentTickerInvestments[ticker] = (currentTickerInvestments[ticker] || 0) + amountInvested;

      const monthYear = moment.utc(t.Date).format('YYYY-MM');
      currentMonthlyTransactionCounts[monthYear] = (currentMonthlyTransactionCounts[monthYear] || 0) + 1;
      currentMonthlyInvestments[monthYear] = (currentMonthlyInvestments[monthYear] || 0) + amountInvested;
    });

    const currentTickerInvestmentSummary = Object.entries(currentTickerInvestments).map(([ticker, amount]) => ({ ticker, amount }));
    const currentMonthlyTransactionCountData = Object.keys(currentMonthlyTransactionCounts).sort().map(month => ({ month, count: currentMonthlyTransactionCounts[month] }));
    const currentMonthlyInvestmentAmountData = Object.keys(currentMonthlyInvestments).sort().map(month => ({ month, amount: currentMonthlyInvestments[month] }));

    // 4. Sort the filteredBaseTransactions for the table
    const sortedTransactions = [...filteredBaseTransactions].sort((a, b) => {
      let aValue;
      let bValue;

      // Ensure consistent data access for sorting
      if (orderBy === 'Date') {
        aValue = new Date(a.Date);
        bValue = new Date(b.Date);
      } else if (['Shares', 'Price', 'Total_Invested', 'Fee'].includes(orderBy)) {
        aValue = safeNum(a[orderBy]);
        bValue = safeNum(b[orderBy]);
      } else { // 'Ticker' and 'Ops' - string comparison
        aValue = (a[orderBy] || '').toString().toLowerCase();
        bValue = (b[orderBy] || '').toString().toLowerCase();
      }

      if (aValue < bValue) return orderDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return orderDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      totalTransactions: allTotalTrans,
      totalAmountInvested: allTotalInvested,
      totalBuyTransactions: allTotalBuyTrans,
      totalSellTransactions: allTotalSellTrans,
      totalBuyAmount: allTotalBuyAmt,
      totalSellAmount: allTotalSellAmt,
      tickerInvestmentSummary: currentTickerInvestmentSummary,
      monthlyTransactionCountData: currentMonthlyTransactionCountData,
      monthlyInvestmentAmountData: currentMonthlyInvestmentAmountData,
      filteredAndSortedTransactions: sortedTransactions,
    };
  }, [transactions, orderBy, orderDirection, operationFilter, tickerFilter]); // Dependencies for useMemo


  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          color: 'white',
          fontWeight: 800,
          background: 'linear-gradient(45deg, #00C49F, #0088FE, #FFBB28)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4
        }}
      >
        <Repeat size={24} color="#f9a825" style={{ marginRight: 10 }} /> Transactions Analysis
      </Typography>

      <Paper elevation={3} sx={{ borderRadius: 2, mb: 4 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} centered indicatorColor="primary" textColor="primary">
          <Tab label="Historical Trend" />
          <Tab label="Transaction Details" />
        </Tabs>
      </Paper>

      {selectedTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              minHeight: 500,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Investment Amount by Ticker
            </Typography>
            {tickerInvestmentSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={tickerInvestmentSummary}
                  margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke={theme.palette.divider}
                    strokeOpacity={0.3}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="ticker"
                    stroke={theme.palette.text.secondary}
                    tick={{
                      fontSize: 11,
                      fill: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                    tickLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 1.5
                    }}
                    axisLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 2
                    }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={80}
                    tickMargin={5}
                  />

                  <YAxis
                    stroke={theme.palette.text.secondary}
                    tick={{
                      fontSize: 12,
                      fill: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                    tickLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 1.5
                    }}
                    axisLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 2
                    }}
                    tickMargin={20}
                    width={80}
                    domain={[0, 'dataMax + 1000']}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                      return formatCurrency(value);
                    }}
                  />

                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    labelFormatter={(label) => `Ticker: ${label}`}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: 12,
                      boxShadow: `0 8px 32px ${theme.palette.action.hover}`,
                      padding: '16px',
                      minWidth: '200px'
                    }}
                    itemStyle={{
                      color: theme.palette.text.primary,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '4px 0'
                    }}
                    labelStyle={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: '8px',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      paddingBottom: '8px'
                    }}
                    cursor={{
                      fill: theme.palette.action.hover,
                      fillOpacity: 0.1
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={50}
                    iconType="rect"
                    wrapperStyle={{
                      paddingBottom: 30,
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                    iconSize={12}
                  />

                  <Bar
                    dataKey="amount"
                    name="Investment Amount"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                    fill="url(#investmentGradient)"
                    stroke={theme.palette.primary.main}
                    strokeWidth={1}
                  >
                    <LabelList
                      dataKey="amount"
                      position="top"
                      formatter={(value) => {
                        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                        if (value >= 10000) return `$${(value / 1000).toFixed(0)}K`;
                        return formatCurrency(value);
                      }}
                      style={{
                        fill: theme.palette.text.primary,
                        fontSize: 10,
                        fontWeight: 700,
                        textShadow: `1px 1px 2px ${theme.palette.background.paper}`
                      }}
                      offset={20}
                    />
                  </Bar>

                  <defs>
                    <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.9} />
                      <stop offset="50%" stopColor={theme.palette.primary.main} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={theme.palette.primary.dark} stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, minHeight: 400 }}>
                <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />                
              </Box>
            )}
          </Paper>

          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              minHeight: 450,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Monthly Transaction Count Trend
            </Typography>
            {monthlyTransactionCountData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <LineChart
                  data={monthlyTransactionCountData}
                  margin={{ top: 40, right: 80, left: 80, bottom: 40 }}
                >
                  {/* Enhanced Grid with subtle styling */}
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke={theme.palette.divider}
                    strokeOpacity={0.3}
                    horizontal={true}
                    vertical={false}
                  />

                  {/* Enhanced X-Axis */}
                  <XAxis
                    dataKey="month"
                    stroke={theme.palette.text.secondary}
                    tick={{
                      fontSize: 12,
                      fill: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                    tickLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 1.5
                    }}
                    axisLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 2
                    }}
                    tickMargin={20}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />

                  {/* Enhanced Y-Axis */}
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    tick={{
                      fontSize: 12,
                      fill: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                    tickLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 1.5
                    }}
                    axisLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 2
                    }}
                    tickMargin={20}
                    width={60}
                    domain={[0, 'dataMax + 5']}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value.toString();
                    }}
                  />

                  {/* Enhanced Tooltip */}
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} transactions`,
                      name
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `2px solid ${theme.palette.info.main}`,
                      borderRadius: 12,
                      boxShadow: `0 8px 32px ${theme.palette.action.hover}`,
                      padding: '16px',
                      minWidth: '180px'
                    }}
                    itemStyle={{
                      color: theme.palette.info.main,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '4px 0'
                    }}
                    labelStyle={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: '8px',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      paddingBottom: '8px'
                    }}
                    cursor={{
                      stroke: theme.palette.info.main,
                      strokeWidth: 2,
                      strokeOpacity: 0.5,
                      strokeDasharray: '4 4'
                    }}
                  />

                  {/* Enhanced Legend */}
                  <Legend
                    verticalAlign="top"
                    height={50}
                    wrapperStyle={{
                      paddingBottom: 25,
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                    iconType="line"
                  />

                  {/* Enhanced Line with gradient and animations */}
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="url(#transactionGradient)"
                    strokeWidth={3}
                    dot={{
                      fill: theme.palette.info.main,
                      strokeWidth: 2,
                      stroke: theme.palette.background.paper,
                      r: 4
                    }}
                    activeDot={{
                      r: 8,
                      fill: theme.palette.info.main,
                      stroke: theme.palette.background.paper,
                      strokeWidth: 3,
                      filter: `drop-shadow(0 2px 8px ${theme.palette.info.main}40)`
                    }}
                    name="Transaction Count"
                  />

                  {/* Add area fill for visual enhancement */}
                  <defs>
                    <linearGradient id="transactionGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={theme.palette.info.light} />
                      <stop offset="50%" stopColor={theme.palette.info.main} />
                      <stop offset="100%" stopColor={theme.palette.info.dark} />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.info.main} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={theme.palette.info.main} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, minHeight: 350 }}>
                <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />
              </Box>
            )}
          </Paper>

          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              minHeight: 450,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Monthly Investment Amount Trend
            </Typography>
            {monthlyInvestmentAmountData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <LineChart
                  data={monthlyInvestmentAmountData}
                  margin={{ top: 40, right: 80, left: 100, bottom: 40 }}
                >
                  {/* Enhanced Grid with subtle styling */}
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke={theme.palette.divider}
                    strokeOpacity={0.3}
                    horizontal={true}
                    vertical={false}
                  />

                  {/* Enhanced X-Axis */}
                  <XAxis
                    dataKey="month"
                    stroke={theme.palette.text.secondary}
                    tick={{
                      fontSize: 12,
                      fill: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                    tickLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 1.5
                    }}
                    axisLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 2
                    }}
                    tickMargin={20}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />

                  {/* Enhanced Y-Axis with smart currency formatting */}
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    tick={{
                      fontSize: 12,
                      fill: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                    tickLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 1.5
                    }}
                    axisLine={{
                      stroke: theme.palette.text.secondary,
                      strokeWidth: 2
                    }}
                    tickMargin={20}
                    width={80}
                    domain={[0, 'dataMax * 1.1']}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                      if (value === 0) return '$0';
                      return `$${value}`;
                    }}
                  />

                  {/* Enhanced Tooltip with rich formatting */}
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `2px solid ${theme.palette.success.main}`,
                      borderRadius: 12,
                      boxShadow: `0 8px 32px ${theme.palette.action.hover}`,
                      padding: '16px',
                      minWidth: '200px'
                    }}
                    itemStyle={{
                      color: theme.palette.success.main,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '4px 0'
                    }}
                    labelStyle={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: '8px',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      paddingBottom: '8px'
                    }}
                    cursor={{
                      stroke: theme.palette.success.main,
                      strokeWidth: 2,
                      strokeOpacity: 0.5,
                      strokeDasharray: '4 4'
                    }}
                  />

                  {/* Enhanced Legend */}
                  <Legend
                    verticalAlign="top"
                    height={50}
                    wrapperStyle={{
                      paddingBottom: 25,
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                    iconType="line"
                  />

                  {/* Enhanced Line with gradient and premium styling */}
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="url(#investmentLineGradient)"
                    strokeWidth={3}
                    dot={{
                      fill: theme.palette.success.main,
                      strokeWidth: 2,
                      stroke: theme.palette.background.paper,
                      r: 4
                    }}
                    activeDot={{
                      r: 8,
                      fill: theme.palette.success.main,
                      stroke: theme.palette.background.paper,
                      strokeWidth: 3,
                      filter: `drop-shadow(0 2px 8px ${theme.palette.success.main}40)`
                    }}
                    name="Investment Amount"
                  />

                  {/* Add area component for visual depth */}
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="none"
                    fill="url(#investmentAreaGradient)"
                    fillOpacity={1}
                  />

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="investmentLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={theme.palette.success.light} />
                      <stop offset="50%" stopColor={theme.palette.success.main} />
                      <stop offset="100%" stopColor={theme.palette.success.dark} />
                    </linearGradient>
                    <linearGradient id="investmentAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity={0.2} />
                      <stop offset="50%" stopColor={theme.palette.success.main} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, minHeight: 350 }}>
                <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />                
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              minHeight: 450,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Average Transaction Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Transactions (All Operations):</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  {totalTransactions}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Invested Amount (All Operations):</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  {formatCurrency(totalAmountInvested)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Average amount per BUY operation:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  {totalBuyTransactions > 0 ? formatCurrency(totalBuyAmount / totalBuyTransactions) : formatCurrency(0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Average amount per SELL operation:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                  {totalSellTransactions > 0 ? formatCurrency(totalSellAmount / totalSellTransactions) : formatCurrency(0)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              minHeight: 450,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {transactions.length > 0 ? (
              <TableContainer
                sx={{
                  flexGrow: 1, // Allows table to take up available height
                  borderRadius: 2,
                  boxShadow: theme.shadows[4],
                  border: `1px solid ${theme.palette.divider}`,
                  overflowY: 'auto', // Enable vertical scrolling
                  overflowX: 'hidden', // Prevent horizontal scrolling
                  // Removed maxHeight to allow full content visibility
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {/* Date Column - Sortable */}
                      <SortableTableCell
                        orderBy={orderBy}
                        orderDirection={orderDirection}
                        property="Date"
                        onRequestSort={handleRequestSort}
                        theme={theme}
                      >
                        Date
                      </SortableTableCell>

                      {/* Ticker Column - Filterable and Sortable */}
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          backgroundColor: theme.palette.background.default,
                          borderBottom: `2px solid ${theme.palette.primary.main}`,
                          fontSize: '0.875rem',
                          padding: '8px 12px', // Adjusted padding
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}> {/* Adjusted gap */}
                          <SortableTableCell
                            orderBy={orderBy}
                            orderDirection={orderDirection}
                            property="Ticker"
                            onRequestSort={handleRequestSort}
                            theme={theme}
                            align="left"
                            // Removed padding and border for nested SortableCell as it's not a direct table cell
                            // Removed sx={{ padding: '0px', borderBottom: 'none' }}
                          >
                            Ticker
                          </SortableTableCell>
                          <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Search Ticker..."
                            value={tickerFilter}
                            onChange={handleTickerFilterChange}
                            sx={{
                              width: '100%', // Ensure it takes full width of cell
                              mt: 0.5, // Small top margin
                              '& .MuiOutlinedInput-root': {
                                height: 32,
                                fontSize: '0.75rem',
                                color: theme.palette.text.primary,
                                '& fieldset': { borderColor: theme.palette.divider },
                                '&:hover fieldset': { borderColor: theme.palette.primary.main },
                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.light },
                                backgroundColor: theme.palette.background.paper,
                              },
                              '& .MuiInputBase-input': {
                                padding: '4px 8px',
                              },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search size={16} color={theme.palette.text.secondary} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                      </TableCell>

                      {/* Operation Column - Filterable */}
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          backgroundColor: theme.palette.background.default,
                          borderBottom: `2px solid ${theme.palette.primary.main}`,
                          fontSize: '0.875rem',
                          padding: '8px 12px', // Adjusted padding
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}> {/* Adjusted gap */}
                          <Typography variant="inherit" sx={{ fontWeight: 'inherit', color: 'inherit', mb: 0.5 }}>
                            Operation
                          </Typography>
                          <ToggleButtonGroup
                            value={operationFilter}
                            exclusive
                            onChange={handleOperationFilterChange}
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                              width: '100%', // Take full width
                              '& .MuiToggleButton-root': {
                                fontSize: '0.7rem',
                                padding: '4px 8px',
                                textTransform: 'none',
                                borderColor: theme.palette.divider,
                                color: theme.palette.text.secondary,
                                flexGrow: 1, // Distribute space evenly
                                '&.Mui-selected': {
                                  backgroundColor: teal[700],
                                  color: 'white',
                                  borderColor: teal[500],
                                  '&:hover': {
                                    backgroundColor: teal[600],
                                  },
                                },
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              },
                            }}
                          >
                            <ToggleButton value="All">All</ToggleButton>
                            <ToggleButton value="Buy">Buy</ToggleButton>
                            <ToggleButton value="Sell">Sell</ToggleButton>
                          </ToggleButtonGroup>
                        </Box>
                      </TableCell>

                      {/* Shares Column - Sortable */}
                      <SortableTableCell
                        orderBy={orderBy}
                        orderDirection={orderDirection}
                        property="Shares"
                        onRequestSort={handleRequestSort}
                        theme={theme}
                        align="right"
                      >
                        Shares
                      </SortableTableCell>

                      {/* Price Column - Sortable */}
                      <SortableTableCell
                        orderBy={orderBy}
                        orderDirection={orderDirection}
                        property="Price"
                        onRequestSort={handleRequestSort}
                        theme={theme}
                        align="right"
                      >
                        Price
                      </SortableTableCell>

                      {/* Total Invested Column - Sortable */}
                      <SortableTableCell
                        orderBy={orderBy}
                        orderDirection={orderDirection}
                        property="Total_Invested"
                        onRequestSort={handleRequestSort}
                        theme={theme}
                        align="right"
                      >
                        Total Invested
                      </SortableTableCell>

                      {/* Fee Column - Sortable */}
                      <SortableTableCell
                        orderBy={orderBy}
                        orderDirection={orderDirection}
                        property="Fee"
                        onRequestSort={handleRequestSort}
                        theme={theme}
                        align="right"
                      >
                        Fee
                      </SortableTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedTransactions.length > 0 ? (
                      filteredAndSortedTransactions.map((row, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                              cursor: 'pointer',
                              transform: 'scale(1.001)',
                              transition: 'all 0.2s ease-in-out'
                            },
                            '&:nth-of-type(odd)': {
                              backgroundColor: theme.palette.action.selected
                            },
                            borderLeft:
                              row.Ops === 'Buy' ? `4px solid ${theme.palette.success.main}` :
                              row.Ops === 'Sell' ? `44px solid ${theme.palette.error.main}` :
                              `4px solid ${theme.palette.info.main}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 600,
                              padding: '14px 12px',
                              fontSize: '0.875rem'
                            }}
                          >
                            {formatDate(row.Date)}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 500,
                              padding: '14px 12px',
                              fontSize: '0.875rem'
                            }}
                          >
                            <Box
                              sx={{
                                display: 'inline-block',
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {row.Ticker || 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 500,
                              padding: '14px 12px',
                              fontSize: '0.875rem'
                            }}
                          >
                            <Chip
                              label={row.Ops || 'N/A'}
                              size="small"
                              sx={{
                                backgroundColor: row.Ops === 'Buy' ? theme.palette.success.main :
                                  row.Ops === 'Sell' ? theme.palette.error.main :
                                    theme.palette.info.main,
                                color: row.Ops === 'Buy' ? theme.palette.success.contrastText :
                                  row.Ops === 'Sell' ? theme.palette.error.contrastText :
                                    theme.palette.info.contrastText,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                minWidth: '60px'
                              }}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 600,
                              padding: '14px 12px',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace'
                            }}
                          >
                            {safeNum(row.Shares).toFixed(3)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 600,
                              padding: '14px 12px',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace'
                            }}
                          >
                            {formatCurrency(row.Price)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 700,
                              padding: '14px 12px',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              backgroundColor: theme.palette.success.light + '20',
                              borderRadius: 1
                            }}
                          >
                            {formatCurrency(row.Total_Invested)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: safeNum(row.Fee) > 0 ? theme.palette.warning.main : theme.palette.text.secondary,
                              fontWeight: 600,
                              padding: '14px 12px',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace'
                            }}
                          >
                            ${safeNum(row.Fee).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: theme.palette.text.secondary }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                            <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />
                            <Typography variant="body2" color="text.secondary">No transactions to display matching current filters.</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // This is the fallback for the entire table if transactions.length === 0 initially
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />                
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
