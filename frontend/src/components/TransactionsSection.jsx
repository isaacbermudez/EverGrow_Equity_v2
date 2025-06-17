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
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, Repeat } from 'lucide-react'; // TrendingUp, TrendingDown removed as they are not used
import moment from 'moment';
import { teal } from '@mui/material/colors'; // Import teal for consistent colors

// Helper for safe number formatting
const safeNum = (n) => (typeof n === 'number' || typeof n === 'string' && !isNaN(parseFloat(n)) ? parseFloat(n) : 0);

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


export default function TransactionsSection({ transactions = [] }) {
  // DEBUG LOG: What data is received by this component?
  console.log("TransactionsSection: Received transactions prop:", transactions);

  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Memoized calculations for transaction summaries, adapted for your data format
  const { totalTransactions, totalAmountInvested, tickerInvestmentSummary, monthlyTransactionCountData, monthlyInvestmentAmountData } = useMemo(() => {
    let totalTrans = transactions.length;
    let totalInvested = 0;
    const tickerInvestments = {}; // Map ticker to total invested amount
    const monthlyTransactionCounts = {}; // Count of transactions per month
    const monthlyInvestments = {}; // Sum of Total_Invested per month

    transactions.forEach(t => {
      const amountInvested = safeNum(t.Total_Invested);
      totalInvested += amountInvested;

      // Use Ticker for summary as 'Platform' field is not present in this data
      const ticker = t.Ticker || 'N/A';
      tickerInvestments[ticker] = (tickerInvestments[ticker] || 0) + amountInvested;

      const monthYear = moment.utc(t.Date).format('YYYY-MM');
      monthlyTransactionCounts[monthYear] = (monthlyTransactionCounts[monthYear] || 0) + 1;
      monthlyInvestments[monthYear] = (monthlyInvestments[monthYear] || 0) + amountInvested;
    });

    // Convert monthly data objects to sorted arrays
    const sortedMonthlyTransactionCountData = Object.keys(monthlyTransactionCounts)
      .sort()
      .map(month => ({ month, count: monthlyTransactionCounts[month] }));

    const sortedMonthlyInvestmentData = Object.keys(monthlyInvestments)
      .sort()
      .map(month => ({ month, amount: monthlyInvestments[month] }));

    return {
      totalTransactions: totalTrans,
      totalAmountInvested: totalInvested,
      tickerInvestmentSummary: Object.entries(tickerInvestments).map(([ticker, amount]) => ({ ticker, amount })),
      monthlyTransactionCountData: sortedMonthlyTransactionCountData,
      monthlyInvestmentAmountData: sortedMonthlyInvestmentData, // Added new monthly investment data
    };
  }, [transactions]);


  // Removed the "No transaction data loaded" message block
  // The component will simply display empty charts/tables if transactions.length === 0


  // Removed SummaryCard component definition and its usage
  // The user requested to only show charts for now.


  return (
    <Box sx={{ width: '100%', p: 2 }}> {/* Removed background gradient from root Box */}
      {/* Main Title - Styled to match PortfolioCharts.jsx */}
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
        <Repeat size={24} color="#f9a825" style={{ marginRight: 10 }} /> Transaction Summary and Analysis
      </Typography>

      {/* Tabs for different transaction views */}
      <Paper elevation={3} sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2, mb: 4 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} centered indicatorColor="primary" textColor="primary">

          <Tab label="Monthly Trend" />
          <Tab label="Transaction Details" />
        </Tabs>
      </Paper>

      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Ticker/Investment Amount Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                Investment Amount by Ticker
              </Typography>
              {tickerInvestmentSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tickerInvestmentSummary} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="ticker" stroke={theme.palette.text.secondary} tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value} />
                    <YAxis stroke={theme.palette.text.secondary} tickFormatter={formatCurrency} />
                    <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} itemStyle={{ color: theme.palette.text.primary }} />
                    <Bar dataKey="amount" fill={teal[500]} name="Invested Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} /> {/* Matched no-data image style */}
                  <Typography variant="body2" color="text.secondary">No investment amount data by ticker.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          {/* Monthly Transaction Count Trend */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                Monthly Transaction Count Trend
              </Typography>
              {monthlyTransactionCountData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTransactionCountData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} itemStyle={{ color: theme.palette.text.primary }} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke={theme.palette.info.main} activeDot={{ r: 8 }} name="Number of Transactions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />
                  <Typography variant="body2" color="text.secondary">No sufficient data for monthly transaction trend.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Monthly Investment Amount Trend */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                Monthly Investment Amount Trend
              </Typography>
              {monthlyInvestmentAmountData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyInvestmentAmountData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} tickFormatter={formatCurrency} />
                    <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} itemStyle={{ color: theme.palette.text.primary }} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke={theme.palette.success.main} activeDot={{ r: 8 }} name="Invested Amount" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />
                  <Typography variant="body2" color="text.secondary">No sufficient data for monthly investment trend.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}


      {selectedTab === 1 && (
        <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>


          {/* Average Transaction Metrics - Now styled as a simple Paper block, matching PortfolioCharts */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                Average Transaction Metrics
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Transactions:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    {totalTransactions}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Invested Amount:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    {formatCurrency(totalAmountInvested)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average investment amount per transaction:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    {totalTransactions > 0 ? formatCurrency(totalAmountInvested / totalTransactions) : formatCurrency(0)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
            All Transactions
          </Typography>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Ticker</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Operation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Shares</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Total Invested</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...transactions].sort((a, b) => new Date(b.Date) - new Date(a.Date)).map((row, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ color: theme.palette.text.primary }}>{formatDate(row.Date)}</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>{row.Ticker || 'N/A'}</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>{row.Ops || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{safeNum(row.Shares).toFixed(3)}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{formatCurrency(row.Price)}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{formatCurrency(row.Total_Invested)}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{safeNum(row.Fee).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
