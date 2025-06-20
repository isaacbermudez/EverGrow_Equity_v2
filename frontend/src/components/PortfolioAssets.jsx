// src/components/PortfolioAssets.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button // Import Button for pagination controls
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Target
} from 'lucide-react';

// Corrected import paths for your images
import SatelliteIcon from '../assets/SATELLITE.png';
import EtfIcon from '../assets/ETF.png';
// Add more imports for other categories if you have them

// Helper: if not a number, fall back to 0
const safeNum = (n) => (typeof n === 'number' ? n : 0);

export default function PortfolioAssets({ rows = [] }) {
  // State for current page (0 for positives, 1 for negatives)
  const [currentPage, setCurrentPage] = useState(0);

  // 1. Filter rows into positive and negative groups
  const positivePLStocks = rows.filter(stock => safeNum(stock.profitLoss) >= 0);
  const negativePLStocks = rows.filter(stock => safeNum(stock.profitLoss) < 0);

  // 2. Sort each group independently based on the requirements
  // Sort positive P/L stocks: highest to lowest
  positivePLStocks.sort((a, b) => safeNum(b.profitLoss) - safeNum(a.profitLoss));

  // Sort negative P/L stocks: most negative first (lowest value) to least negative
  negativePLStocks.sort((a, b) => safeNum(a.profitLoss) - safeNum(b.profitLoss));

  // Determine which set of rows to display based on the current page
  const displayedRows = currentPage === 0 ? positivePLStocks : negativePLStocks;

  // Effect to adjust currentPage if the active page becomes empty
  useEffect(() => {
    // If on positive page and it's empty, but negative page is not empty, switch to negative page
    if (currentPage === 0 && positivePLStocks.length === 0 && negativePLStocks.length > 0) {
      setCurrentPage(1);
    }
    // If on negative page and it's empty, but positive page is not empty, switch to positive page
    else if (currentPage === 1 && negativePLStocks.length === 0 && positivePLStocks.length > 0) {
      setCurrentPage(0);
    }
    // If both are empty, or if current page is already valid, do nothing.
  }, [rows, currentPage, positivePLStocks.length, negativePLStocks.length]);


  // Compute totals for the ENTIRE portfolio (not just the displayed page)
  const totalValue = rows.reduce((sum, s) => sum + safeNum(s.marketValue), 0);
  const totalPL = rows.reduce((sum, s) => sum + safeNum(s.profitLoss), 0);
  const totalPLPct =
    totalValue - totalPL > 0 ? (totalPL / (totalValue - totalPL)) * 100 : 0;

  // Inject keyframes for slideUp and pulse
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp { from {opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse { 0%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.7}100%{transform:scale(1);opacity:1} }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const HoldingCard = ({ stock, index }) => {
    const isPos = safeNum(stock.profitLoss) >= 0;
    // Delay for animation might need adjustment or removal if pagination makes it jumpy
    const delay = index * 0.1;
    const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
    const plPct = safeNum(stock.profitLossPct);

    // Determine which icon to display based on category
    let assetImageSrc = null;
    if (stock.category === 'SATELLITES') {
      assetImageSrc = SatelliteIcon;
    } else if (stock.category === 'ETF') {
      assetImageSrc = EtfIcon;
    }
    // You can add more conditions here for other categories/images

    return (
      <Card
        variant="outlined"
        sx={{
          animation: `slideUp 0.8s ease-out ${delay}s both`,
          cursor: 'default',
          '&:hover': { transform: 'none' }
        }}
      >
        <CardContent>
          {/* Header: Symbol, Sector, and Trending Icon */}
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
                // Conditional styling for background image or fallback color
                sx={{
                  bgcolor: assetImageSrc ? 'transparent' : 'primary.light', // Transparent if using image
                  ...(assetImageSrc && {
                    backgroundImage: `url(${assetImageSrc})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                  })
                }}
              >
                {!assetImageSrc && ( // Only show initial if no specific image
                  <Typography variant="h6" color="primary.contrastText">
                    {stock.symbol[0]}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1">{stock.symbol}</Typography>
                {/* Displaying Sector from JSON */}
                <Typography variant="caption" color="text.secondary">
                  {stock.sector || 'N/A'}
                </Typography>
              </Box>
            </Box>
            {/* Icon indicating P/L trend */}
            {isPos ? <TrendingUp color="green" /> : <TrendingDown color="red" />}
          </Box>

          {/* Metrics Grid */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Holdings
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {safeNum(stock.holdings)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Price
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                ${safeNum(stock.currentPrice).toFixed(2)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Invested
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                ${safeNum(stock.CI).toFixed(2)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Market Value
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                ${marketValue.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>

          {/* P/L Values */}
          <Box mt={2} display="flex" justifyContent="space-between" alignItems="baseline">
            <Typography variant="body2" color="text.secondary">P/L</Typography>
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
                {isPos && '+'}{plPct.toFixed(2)}%
              </Typography>
            </Box>
          </Box>

        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Pagination Controls - conditionally rendered */}
      <Box display="flex" justifyContent="center" mb={4}>
        {positivePLStocks.length > 0 && (
          <Button
            variant={currentPage === 0 ? "contained" : "outlined"}
            onClick={() => setCurrentPage(0)}
            sx={{ mr: 2 }}
          >
            Positive P/L ({positivePLStocks.length})
          </Button>
        )}
        {negativePLStocks.length > 0 && (
          <Button
            variant={currentPage === 1 ? "contained" : "outlined"}
            onClick={() => setCurrentPage(1)}
          >
            Negative P/L ({negativePLStocks.length})
          </Button>
        )}
      </Box>

      {/* Holdings Grid - now displays based on currentPage */}
      <Grid container spacing={2}>
        {displayedRows.length > 0 ? (
          displayedRows.map((stock, idx) => (
            <Grid key={stock.symbol} item xs={12} md={4} lg={3}>
              <HoldingCard stock={stock} index={idx} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" color="text.secondary" textAlign="center" mt={4}>
              {/* Conditional message based on which page is empty */}
              {positivePLStocks.length === 0 && negativePLStocks.length === 0
                ? "No positions to display."
                : (currentPage === 0
                  ? "No positive P/L positions to display."
                  : "No negative P/L positions to display.")
              }
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}