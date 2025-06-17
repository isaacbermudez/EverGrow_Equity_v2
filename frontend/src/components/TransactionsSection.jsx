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
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, Repeat, TrendingUp, TrendingDown } from 'lucide-react'; // Removed Wallet and Tag icons for deposits/fees
import moment from 'moment'; // For date handling and grouping

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
    return dateString; // Fallback to original string if parsing fails
  }
};


export default function TransactionsSection({ transactions = [] }) {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Memoized calculations for transaction summaries (focused on transactions only)
  const { totalTransactions, totalBuyingPower, platformsSummary, monthlyTransactionCountData } = useMemo(() => {
    let totalTrans = transactions.length;
    let totalBP = 0;
    const platforms = {};
    const monthlyTransactionCounts = {};

    transactions.forEach(t => {
      totalBP += safeNum(t.Buying_Power); // Sum up Buying_Power for total

      const platformName = t.Platform || 'N/A';
      // Summarizing Buying_Power per platform
      platforms[platformName] = (platforms[platformName] || 0) + safeNum(t.Buying_Power);

      // Aggregate for monthly trends (counting transactions per month)
      const monthYear = moment.utc(t.Date).format('YYYY-MM');
      monthlyTransactionCounts[monthYear] = (monthlyTransactionCounts[monthYear] || 0) + 1; // Count transactions
    });

    // Convert monthly data objects to sorted arrays
    const sortedMonthlyTransactionCountData = Object.keys(monthlyTransactionCounts)
      .sort()
      .map(month => ({ month, count: monthlyTransactionCounts[month] }));


    return {
      totalTransactions: totalTrans,
      totalBuyingPower: totalBP,
      platformsSummary: Object.entries(platforms).map(([platform, amount]) => ({ platform, amount })),
      monthlyTransactionCountData: sortedMonthlyTransactionCountData
    };
  }, [transactions]);


  if (transactions.length === 0) {
    return (
      <Box sx={{
        p: 3,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        minHeight: 'calc(100vh - 64px)', // Adjust based on your header height
        textAlign: 'center'
      }}>
        <img src="/no-data.svg" alt="No data" style={{ maxWidth: '250px', opacity: 0.6, marginBottom: 24 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No hay datos de transacciones cargados.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Por favor, suba su archivo JSON de cartera para comenzar.
        </Typography>
      </Box>
    );
  }

  const SummaryCard = ({ icon: Icon, title, value, color }) => (
    <Paper elevation={3} sx={{
      p: 2,
      bgcolor: theme.palette.background.paper,
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }}>
      <Icon size={32} color={color || theme.palette.primary.main} />
      <Box>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box p={3} sx={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', flexGrow: 1 }}>
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
        <Repeat size={24} color="#f9a825" style={{ marginRight: 10 }} /> Resumen y Análisis de Transacciones
      </Typography>

      {/* Transaction Summary Cards (Adjusted to only show relevant metrics) */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={6}>
          <SummaryCard icon={Repeat} title="Total Transacciones" value={totalTransactions} color={theme.palette.info.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <SummaryCard icon={DollarSign} title="Total Poder de Compra" value={formatCurrency(totalBuyingPower)} color={theme.palette.success.main} />
        </Grid>
      </Grid>

      {/* Tabs for different transaction views */}
      <Paper elevation={3} sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2, mb: 4 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} centered indicatorColor="primary" textColor="primary">
          <Tab label="Vista General" />
          <Tab label="Tendencia Mensual" />
          <Tab label="Detalle de Transacciones" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Platform Distribution Chart/Table */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Poder de Compra por Plataforma
              </Typography>
              {platformsSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformsSummary} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="platform" stroke={theme.palette.text.secondary} tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value} />
                    <YAxis stroke={theme.palette.text.secondary} tickFormatter={formatCurrency} />
                    <Tooltip formatter={formatCurrency} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} itemStyle={{ color: theme.palette.text.primary }} />
                    <Bar dataKey="amount" fill={theme.palette.primary.main} name="Poder de Compra" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay datos de poder de compra por plataforma.</Typography>
              )}
            </Paper>
          </Grid>

          {/* Average Transaction Metrics (Adjusted for general transaction metrics) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Promedio de Transacciones
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Poder de compra promedio por transacción:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    {formatCurrency(totalBuyingPower / totalTransactions)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={3}>
          {/* Monthly Transaction Count Trend */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Tendencia Mensual de Transacciones
              </Typography>
              {monthlyTransactionCountData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTransactionCountData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} /> {/* YAxis for count, not currency */}
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} itemStyle={{ color: theme.palette.text.primary }} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke={theme.palette.info.main} activeDot={{ r: 8 }} name="Número de Transacciones" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay datos suficientes para la tendencia mensual de transacciones.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 2 && (
        <Paper elevation={3} sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
            Todas las Transacciones
          </Typography>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Plataforma</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Poder de Compra</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>BCCR Compra</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}>Plat. Compra</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...transactions].sort((a, b) => new Date(b.Date) - new Date(a.Date)).map((row, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ color: theme.palette.text.primary }}>{formatDate(row.Date)}</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>{row.Platform || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{formatCurrency(row.Buying_Power)}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{safeNum(row.BCCR_Compra).toFixed(2) || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{safeNum(row.Plaform_Compra).toFixed(2) || 'N/A'}</TableCell>
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
