import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Target,
} from 'lucide-react';
import SatelliteIcon from '../assets/SATELLITE.png';
import EtfIcon from '../assets/ETF.png';

const categoryIcons = {
  SATELLITES: SatelliteIcon,
  ETF: EtfIcon,
};

const safeNum = (n) => (typeof n === 'number' ? n : 0);

export default function PortfolioAssets({ rows = [] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [initialRender, setInitialRender] = useState(true);

  useEffect(() => {
    setTimeout(() => setInitialRender(false), 1000); // Disable animation after initial render
  }, []);

  const positivePLStocks = useMemo(
    () =>
      rows
        .filter((stock) => safeNum(stock.profitLoss) >= 0)
        .sort((a, b) => safeNum(b.profitLoss) - safeNum(a.profitLoss)),
    [rows]
  );
  const negativePLStocks = useMemo(
    () =>
      rows
        .filter((stock) => safeNum(stock.profitLoss) < 0)
        .sort((a, b) => safeNum(a.profitLoss) - safeNum(b.profitLoss)),
    [rows]
  );

  useEffect(() => {
    if (
      currentPage === 0 &&
      positivePLStocks.length === 0 &&
      negativePLStocks.length > 0
    ) {
      setCurrentPage(1);
    } else if (
      currentPage === 1 &&
      negativePLStocks.length === 0 &&
      positivePLStocks.length > 0
    ) {
      setCurrentPage(0);
    }
  }, [rows, currentPage, positivePLStocks.length, negativePLStocks.length]);

  const totalValue = rows.reduce((sum, s) => sum + safeNum(s.marketValue), 0);
  const totalPL = rows.reduce((sum, s) => sum + safeNum(s.profitLoss), 0);
  const totalPLPct =
    totalValue - totalPL > 0 ? (totalPL / (totalValue - totalPL)) * 100 : 0;

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp { from {opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse { 0%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.7}100%{transform:scale(1);opacity:1} }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const SummaryCard = ({ icon: Icon, title, value, change }) => {
    const isPos = safeNum(change) >= 0;
    return (
      <Card
        variant="outlined"
        sx={{
          animation: initialRender ? 'slideUp 0.8s ease-out' : 'none',
          cursor: 'default',
        }}
        role="region"
        aria-label={title}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Icon size={24} color="#1976d2" />
            <Typography
              variant="subtitle2"
              color={isPos ? 'success.main' : 'error.main'}
            >
              {isPos && '+'}
              {safeNum(change).toFixed(2)}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h6">{value}</Typography>
        </CardContent>
      </Card>
    );
  };

  const HoldingCard = React.memo(({ stock, index }) => {
    const isPos = safeNum(stock.profitLoss) >= 0;
    const delay = index * 0.1;
    const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
    const plPct = safeNum(stock.profitLossPct);
    const assetImageSrc = categoryIcons[stock.category] || null;

    return (
      <Card
        variant="outlined"
        sx={{
          animation: initialRender ? `slideUp 0.8s ease-out ${delay}s both` : 'none',
          cursor: 'default',
          '&:hover': { transform: 'none' },
        }}
        role="region"
        aria-label={`Stock holding for ${stock.symbol}`}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Box
                width={40}
                height={40}
                mr={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius={1}
                sx={{
                  bgcolor: assetImageSrc ? 'transparent' : 'primary.light',
                  ...(assetImageSrc && {
                    backgroundImage: `url(${assetImageSrc})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                  }),
                }}
              >
                {!assetImageSrc && (
                  <Typography variant="h6" color="primary.contrastText">
                    {stock.symbol[0]}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1">{stock.symbol}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stock.sector || 'N/A'}
                </Typography>
              </Box>
            </Box>
            {isPos ? <TrendingUp color="green" /> : <TrendingDown color="red" />}
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Holdings
              </Typography>
              <Typography variant="subtitle1">
                {safeNum(stock.holdings)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Price
              </Typography>
              <Typography variant="subtitle1">
                ${safeNum(stock.currentPrice).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Invested
              </Typography>
              <Typography variant="subtitle1">
                ${safeNum(stock.CI).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Market Value
              </Typography>
              <Typography variant="subtitle1">
                ${marketValue.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
          <Box mt={2} display="flex" justifyContent="space-between" alignItems="baseline">
            <Typography variant="body2" color="text.secondary">
              P/L
            </Typography>
            <Box textAlign="right">
              <Typography
                variant="subtitle1"
                color={isPos ? 'success.main' : 'error.main'}
              >
                {isPos && '+'}${safeNum(stock.profitLoss).toFixed(2)}
              </Typography>
              <Typography
                variant="caption"
                color={isPos ? 'success.main' : 'error.main'}
              >
                {isPos && '+'}
                {plPct.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  });

  if (!rows) {
    return (
      <Box p={3} sx={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
        <Typography color="text.secondary">No portfolio data available.</Typography>
      </Box>
    );
  }

  const displayedRows = currentPage === 0 ? positivePLStocks : negativePLStocks;

  return (
    <Box p={3} sx={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>      
      <Box>
        <Box display="flex" justifyContent="center" mb={4}>
          {positivePLStocks.length > 0 && (
            <Button
              variant={currentPage === 0 ? 'contained' : 'outlined'}
              onClick={() => setCurrentPage(0)}
              sx={{ mr: 2 }}
              aria-label={`Show ${positivePLStocks.length} positive P/L stocks`}
            >
              Positive P/L ({positivePLStocks.length})
            </Button>
          )}
          {negativePLStocks.length > 0 && (
            <Button
              variant={currentPage === 1 ? 'contained' : 'outlined'}
              onClick={() => setCurrentPage(1)}
              aria-label={`Show ${negativePLStocks.length} negative P/L stocks`}
            >
              Negative P/L ({negativePLStocks.length})
            </Button>
          )}
        </Box>
        <Grid container spacing={2}>
          {displayedRows.length > 0 ? (
            displayedRows.map((stock, idx) => (
              <Grid key={stock.symbol} item xs={12} md={4} lg={3}>
                <HoldingCard stock={stock} index={idx} />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography
                variant="h6"
                color="text.secondary"
                textAlign="center"
                mt={4}
              >
                {positivePLStocks.length === 0 && negativePLStocks.length === 0
                  ? 'No positions to display.'
                  : currentPage === 0
                  ? 'No positive P/L positions to display.'
                  : 'No negative P/L positions to display.'}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}