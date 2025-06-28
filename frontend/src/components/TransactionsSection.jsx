import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, useTheme, Tabs, Tab, IconButton, TextField,
  InputAdornment, ToggleButton, ToggleButtonGroup, Chip, ButtonGroup, Button
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList } from 'recharts';
import { Repeat, ArrowUp, ArrowDown, Search } from 'lucide-react';
import moment from 'moment';
import { teal } from '@mui/material/colors';

const safeNum = (n) => (typeof n === 'number' || (typeof n === 'string' && !isNaN(parseFloat(n))) ? parseFloat(n) : 0);
const formatCurrency = (amount) => `$${safeNum(amount).toFixed(2)}`;
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return moment.utc(dateString).format('YYYY-MM-DD');
  } catch (e) {
    return dateString;
  }
};

const SortableTableCell = ({ children, orderBy, orderDirection, property, onRequestSort, theme, align = 'left' }) => {
  const isSorted = orderBy === property;
  return (
    <TableCell
      align={align}
      sx={{
        fontWeight: 700,
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        fontSize: '0.875rem',
        padding: '16px 12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        '&:hover': { backgroundColor: theme.palette.action.hover },
      }}
      onClick={() => onRequestSort(property)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        {children}
        {isSorted ? (
          orderDirection === 'desc' ? <ArrowDown style={{ fontSize: 16, marginLeft: 4 }} /> : <ArrowUp style={{ fontSize: 16, marginLeft: 4 }} />
        ) : (
          <ArrowUp style={{ fontSize: 16, marginLeft: 4, opacity: 0.3 }} />
        )}
      </Box>
    </TableCell>
  );
};

export default function TransactionsSection({ transactions = [], deposits = [] }) {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [orderBy, setOrderBy] = useState('Date');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [operationFilter, setOperationFilter] = useState('All');
  const [tickerFilter, setTickerFilter] = useState('');
  const [minAmountThreshold, setMinAmountThreshold] = useState(0);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const renderBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (minAmountThreshold > 0 && value < minAmountThreshold) return null;

    return (
      <text
        x={x + width + 5}
        y={y + height / 2}
        fill={theme.palette.text.primary}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="700"
      >
        {formatCurrency(value)}
      </text>
    );
  };

  const {
    tickerInvestmentSummary,
    monthlyTransactionCountData,
    monthlyInvestmentAmountData,
    filteredAndSortedTransactions,
    sortedDeposits,
    totalDepositAmount, // Added for deposits total
    totalBuyingPower,   // Added for buying power total
    totalFeeAmount,     // Added for fee amount total
  } = useMemo(() => {
    // Apply filters
    const filtered = transactions.filter(t => {
      const matchesOperation = operationFilter === 'All' || (t.Ops && t.Ops.toLowerCase() === operationFilter.toLowerCase());
      const matchesTicker = tickerFilter === '' || (t.Ticker && t.Ticker.toLowerCase().includes(tickerFilter.toLowerCase()));
      return matchesOperation && matchesTicker;
    });

    // Prepare chart data
    const tickerInvestments = {};
    const monthlyTransactionCounts = {};
    const monthlyInvestments = {};

    filtered.forEach(t => {
      const amount = safeNum(t.Total_Invested);
      const ticker = t.Ticker || 'N/A';
      tickerInvestments[ticker] = (tickerInvestments[ticker] || 0) + amount;

      const monthYear = moment.utc(t.Date).format('YYYY-MM');
      monthlyTransactionCounts[monthYear] = (monthlyTransactionCounts[monthYear] || 0) + 1;
      monthlyInvestments[monthYear] = (monthlyInvestments[monthYear] || 0) + amount;
    });

    const tickerSummary = Object.entries(tickerInvestments)
      .map(([ticker, amount]) => ({ ticker, amount }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyCountData = Object.keys(monthlyTransactionCounts).sort()
      .map(month => ({ month, count: monthlyTransactionCounts[month] }));

    const monthlyAmountData = Object.keys(monthlyInvestments).sort()
      .map(month => ({ month, amount: monthlyInvestments[month] }));

    // Sort filtered data
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      if (orderBy === 'Date') {
        aValue = new Date(a.Date);
        bValue = new Date(b.Date);
      } else if (['Shares', 'Price', 'Total_Invested', 'Fee'].includes(orderBy)) {
        aValue = safeNum(a[orderBy]);
        bValue = safeNum(b[orderBy]);
      } else {
        aValue = (a[orderBy] || '').toString().toLowerCase();
        bValue = (b[orderBy] || '').toString().toLowerCase();
      }
      if (aValue < bValue) return orderDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return orderDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Sort deposits data based on actual keys
    const sortedDeposits = [...deposits].sort((a, b) => {
      let aValue, bValue;
      if (orderBy === 'Date') {
        aValue = new Date(a.Date);
        bValue = new Date(b.Date);
      } else if (orderBy === 'Deposit_Amount' || orderBy === 'Buying_Power' || orderBy === 'Fee_Amount') {
        aValue = safeNum(a[orderBy]);
        bValue = safeNum(b[orderBy]);
      } else {
        aValue = (a[orderBy] || '').toString().toLowerCase();
        bValue = (b[orderBy] || '').toString().toLowerCase();
      }
      if (aValue < bValue) return orderDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return orderDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Calculate totals for deposits
    const totalDepositAmount = deposits.reduce((sum, d) => sum + safeNum(d.Deposit_Amount), 0);
    const totalBuyingPower = deposits.reduce((sum, d) => sum + safeNum(d.Buying_Power), 0);
    const totalFeeAmount = deposits.reduce((sum, d) => sum + safeNum(d.Fee_Amount), 0);


    return {
      tickerInvestmentSummary: tickerSummary,
      monthlyTransactionCountData: monthlyCountData,
      monthlyInvestmentAmountData: monthlyAmountData,
      filteredAndSortedTransactions: sorted,
      sortedDeposits,
      totalDepositAmount,
      totalBuyingPower,
      totalFeeAmount,
    };
  }, [transactions, deposits, orderBy, orderDirection, operationFilter, tickerFilter]);

  const chartStyle = {
    p: 3,
    borderRadius: 2,
    minHeight: 450,
    border: '1px solid rgba(255,255,255,0.12)',
  };

  const commonChartProps = {
    width: "100%",
    height: 450
  };

  const commonAxisProps = {
    stroke: theme.palette.text.secondary,
    tick: { fontSize: 12, fill: theme.palette.text.secondary, fontWeight: 500 },
    tickLine: { stroke: theme.palette.text.secondary, strokeWidth: 1.5 },
    axisLine: { stroke: theme.palette.text.secondary, strokeWidth: 2 },
    tickMargin: 20
  };

  const commonTooltipProps = {
    contentStyle: {
      backgroundColor: theme.palette.background.paper,
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: 12,
      padding: '16px',
      minWidth: '200px'
    },
    itemStyle: { fontSize: 13, fontWeight: 600, padding: '4px 0' },
    labelStyle: { fontWeight: 700, fontSize: 14, marginBottom: '8px' }
  };

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

      <Paper elevation={0} sx={{ borderRadius: 2, mb: 4 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} centered>
          <Tab label="Historical Trend" />
          <Tab label="Transaction Details" />
          <Tab label="Deposits" />
        </Tabs>
      </Paper>

      {selectedTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Controls */}
          {tickerInvestmentSummary.length > 0 && (
            <Box sx={{
              display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center',
              p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)', mb: 1
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Min $:
              </Typography>
              <ButtonGroup size="small">
                <Button
                  onClick={() => setMinAmountThreshold(0)}
                  variant={minAmountThreshold === 0 ? 'contained' : 'outlined'}
                  sx={{
                    minWidth: 35, fontSize: '0.7rem',
                    color: minAmountThreshold === 0 ? 'white' : 'rgba(255,255,255,0.7)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    backgroundColor: minAmountThreshold === 0 ? teal[600] : 'transparent',
                  }}
                >
                  All
                </Button>
                {[200, 500, 5000].map(threshold => (
                  <Button
                    key={threshold}
                    onClick={() => setMinAmountThreshold(threshold)}
                    variant={minAmountThreshold === threshold ? 'contained' : 'outlined'}
                    sx={{
                      minWidth: 35, fontSize: '0.7rem',
                      color: minAmountThreshold === threshold ? 'white' : 'rgba(255,255,255,0.7)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: minAmountThreshold === threshold ? teal[600] : 'transparent',
                    }}
                  >
                    ${threshold / 1000}K
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
          )}

          {/* Investment by Ticker Chart */}
          <Paper elevation={0} sx={chartStyle}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Investment Amount by Ticker
            </Typography>
            {tickerInvestmentSummary.length > 0 ? (
              <ResponsiveContainer {...commonChartProps} height={Math.max(300, tickerInvestmentSummary.length * 30)}>
                <BarChart data={tickerInvestmentSummary} layout="vertical" margin={{ top: 10, right: 60, left: 80, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={theme.palette.divider} strokeOpacity={0.3} horizontal={false} />
                  <XAxis type="number" {...commonAxisProps} width={80} domain={[0, 'dataMax + 1000']}
                    tickFormatter={(value) => value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : formatCurrency(value)} />
                  <YAxis dataKey="ticker" type="category" {...commonAxisProps} width={100} tickMargin={5} />
                   {/* <Tooltip {...commonTooltipProps} formatter={(value) => [formatCurrency(value), 'Investment Amount']} labelFormatter={(label) => `Ticker: ${label}`} />*/}
                  <Legend verticalAlign="top" height={50} />
                  <Bar dataKey="amount" name="Investment Amount" radius={[0, 6, 6, 0]} barSize={20} fill="url(#horizontalInvestmentGradient)" stroke={theme.palette.primary.main} strokeWidth={1}>
                    <LabelList dataKey="amount" position="right" content={renderBarLabel} />
                  </Bar>
                  <defs>
                    <linearGradient id="horizontalInvestmentGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={theme.palette.primary.dark} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5, minHeight: 400 }}>
                <Typography variant="h6" color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>

          {/* Monthly Transaction Count Chart */}
          <Paper elevation={0} sx={chartStyle}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Monthly Transaction Count Trend
            </Typography>
            {monthlyTransactionCountData.length > 0 ? (
              <ResponsiveContainer {...commonChartProps}>
                <LineChart data={monthlyTransactionCountData} margin={{ top: 40, right: 80, left: 80, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={theme.palette.divider} strokeOpacity={0.3} />
                  <XAxis dataKey="month" {...commonAxisProps} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis {...commonAxisProps} width={60} domain={[0, 'dataMax + 5']} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()} />
                  <Tooltip {...commonTooltipProps} formatter={(value) => [`${value} transactions`, 'Transaction Count']} labelFormatter={(label) => `Month: ${label}`} />
                  <Legend verticalAlign="top" height={50} />
                  <Line type="monotone" dataKey="count" stroke={theme.palette.info.main} strokeWidth={3} dot={{ fill: theme.palette.info.main, r: 4 }} name="Transaction Count" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5, minHeight: 350 }}>
                <Typography variant="h6" color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>

          {/* Monthly Investment Amount Chart */}
          <Paper elevation={0} sx={chartStyle}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Monthly Investment Amount Trend
            </Typography>
            {monthlyInvestmentAmountData.length > 0 ? (
              <ResponsiveContainer {...commonChartProps}>
                <LineChart data={monthlyInvestmentAmountData} margin={{ top: 40, right: 80, left: 100, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={theme.palette.divider} strokeOpacity={0.3} />
                  <XAxis dataKey="month" {...commonAxisProps} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis {...commonAxisProps} width={80} domain={[0, 'dataMax * 1.1']}
                    tickFormatter={(value) => value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : value === 0 ? '$0' : `$${value}`} />
                  <Tooltip {...commonTooltipProps} formatter={(value) => [formatCurrency(value), 'Investment Amount']} labelFormatter={(label) => `Month: ${label}`} />
                  <Legend verticalAlign="top" height={50} />
                  <Line type="monotone" dataKey="amount" stroke={theme.palette.success.main} strokeWidth={3} dot={{ fill: theme.palette.success.main, r: 4 }} name="Investment Amount" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5, minHeight: 350 }}>
                <Typography variant="h6" color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {selectedTab === 1 && (
        <Paper elevation={0} sx={chartStyle}>
          {transactions.length > 0 ? (
            <TableContainer sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Date" onRequestSort={handleRequestSort} theme={theme}>Date</SortableTableCell>

                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary, backgroundColor: theme.palette.background.default, borderBottom: `2px solid ${theme.palette.primary.main}`, fontSize: '0.875rem', padding: '8px 12px', textTransform: 'uppercase' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                          <Typography variant="inherit">Ticker</Typography>
                          <IconButton onClick={() => handleRequestSort('Ticker')} size="small" sx={{ ml: 'auto', color: theme.palette.text.primary }}>
                            {orderBy === 'Ticker' && orderDirection === 'desc' ? <ArrowDown style={{ fontSize: 16 }} /> : <ArrowUp style={{ fontSize: 16, opacity: orderBy === 'Ticker' ? 1 : 0.3 }} />}
                          </IconButton>
                        </Box>
                        <TextField
                          variant="outlined" size="small" placeholder="Search Ticker..." value={tickerFilter} onChange={(e) => setTickerFilter(e.target.value)}
                          sx={{ width: '100%', '& .MuiOutlinedInput-root': { height: 32, fontSize: '0.75rem', backgroundColor: theme.palette.background.paper } }}
                          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary, backgroundColor: theme.palette.background.default, borderBottom: `2px solid ${theme.palette.primary.main}`, fontSize: '0.875rem', padding: '8px 12px', textTransform: 'uppercase' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="inherit" sx={{ mb: 0.5 }}>Operation</Typography>
                        <ToggleButtonGroup
                          value={operationFilter} exclusive onChange={(e, v) => v && setOperationFilter(v)} size="small"
                          sx={{ width: '100%', '& .MuiToggleButton-root': { fontSize: '0.7rem', padding: '4px 8px', flexGrow: 1, '&.Mui-selected': { backgroundColor: teal[700], color: 'white' } } }}
                        >
                          <ToggleButton value="All">All</ToggleButton>
                          <ToggleButton value="Buy">Buy</ToggleButton>
                          <ToggleButton value="Sell">Sell</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                    </TableCell>

                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Shares" onRequestSort={handleRequestSort} theme={theme} align="right">Shares</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Price" onRequestSort={handleRequestSort} theme={theme} align="right">Price</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Total_Invested" onRequestSort={handleRequestSort} theme={theme} align="right">Total Invested</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Fee" onRequestSort={handleRequestSort} theme={theme} align="right">Fee</SortableTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedTransactions.length > 0 ? (
                    filteredAndSortedTransactions.map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:hover': { backgroundColor: theme.palette.action.hover, cursor: 'pointer' },
                          '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.selected },
                          borderLeft: `4px solid ${row.Ops === 'Buy' ? theme.palette.success.main : row.Ops === 'Sell' ? theme.palette.error.main : theme.palette.info.main}`,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, padding: '14px 12px' }}>{formatDate(row.Date)}</TableCell>
                        <TableCell sx={{ padding: '14px 12px' }}>
                          <Box sx={{ display: 'inline-block', backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {row.Ticker || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ padding: '14px 12px' }}>
                          <Chip
                            label={row.Ops || 'N/A'} size="small"
                            sx={{
                              backgroundColor: row.Ops === 'Buy' ? theme.palette.success.main : row.Ops === 'Sell' ? theme.palette.error.main : theme.palette.info.main,
                              color: 'white', fontWeight: 600, fontSize: '0.75rem', minWidth: '60px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{safeNum(row.Shares).toFixed(3)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(row.Price)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', backgroundColor: theme.palette.success.light + '20', borderRadius: 1 }}>{formatCurrency(row.Total_Invested)}</TableCell>
                        <TableCell align="right" sx={{ color: safeNum(row.Fee) > 0 ? theme.palette.warning.main : theme.palette.text.secondary, fontWeight: 600, fontFamily: 'monospace' }}>${safeNum(row.Fee).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="h6" color="text.secondary">No transactions found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
              <Typography variant="h6" color="text.secondary">No data available</Typography>
            </Box>
          )}
        </Paper>
      )}

      {selectedTab === 2 && (
        <Paper elevation={0} sx={chartStyle}>
          {deposits.length > 0 ? (
            <TableContainer sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Date" onRequestSort={handleRequestSort} theme={theme}>Date</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Deposit_Amount" onRequestSort={handleRequestSort} theme={theme} align="right">Deposit Amount</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Buying_Power" onRequestSort={handleRequestSort} theme={theme} align="right">Buying Power</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Fee_Amount" onRequestSort={handleRequestSort} theme={theme} align="right">Fee Amount</SortableTableCell>
                    <SortableTableCell orderBy={orderBy} orderDirection={orderDirection} property="Platform" onRequestSort={handleRequestSort} theme={theme}>Platform</SortableTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedDeposits.length > 0 ? (
                    sortedDeposits.map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:hover': { backgroundColor: theme.palette.action.hover, cursor: 'pointer' },
                          '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.selected },
                          borderLeft: `4px solid ${theme.palette.info.main}`,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, padding: '14px 12px' }}>{formatDate(row.Date)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(row.Deposit_Amount)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', backgroundColor: theme.palette.success.light + '20', borderRadius: 1 }}>{formatCurrency(row.Buying_Power)}</TableCell> {/* Highlighted */}
                        <TableCell align="right" sx={{ color: safeNum(row.Fee_Amount) > 0 ? theme.palette.warning.main : theme.palette.text.secondary, fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(row.Fee_Amount)}</TableCell>
                        <TableCell sx={{ padding: '14px 12px' }}>{row.Platform || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                        <Typography variant="h6" color="text.secondary">No deposit records found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {deposits.length > 0 && (
                    <TableRow sx={{ '&:hover': { backgroundColor: 'transparent' }, backgroundColor: theme.palette.background.paper, borderTop: `2px solid ${theme.palette.primary.main}` }}>
                      <TableCell sx={{ fontWeight: 700, padding: '14px 12px', fontSize: '0.9rem', color: theme.palette.text.primary }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem', color: theme.palette.success.main }}>{formatCurrency(totalDepositAmount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem', backgroundColor: theme.palette.success.light + '20', borderRadius: 1, color: theme.palette.success.main }}>{formatCurrency(totalBuyingPower)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem', color: theme.palette.warning.main }}>{formatCurrency(totalFeeAmount)}</TableCell>
                      <TableCell></TableCell> {/* Empty cell for Platform column in totals row */}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
              <Typography variant="h6" color="text.secondary">No data available</Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}