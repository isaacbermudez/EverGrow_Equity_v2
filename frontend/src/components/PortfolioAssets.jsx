// src/components/PortfolioAssets.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button // Import Button for pagination controls
} from '@mui/material';

// Corrected import paths for your images
import SatelliteIcon from '../assets/SATELLITE.png';
import EtfIcon from '../assets/ETF.png';
// Add more imports for other categories if you have them

// Import the new AssetFlipCard component
import AssetFlipCard from './AssetFlipCard'; // Assuming it's in the same components folder

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

  // Inject keyframes for slideUp and pulse (if still desired, though AssetFlipCard has its own transition)
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp { from {opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      /* @keyframes pulse { 0%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.7}100%{transform:scale(1);opacity:1} } */
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Box>
      {/* Pagination Controls - conditionally rendered */}
      <Box display="block" justifyContent="center" mb={4}>
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
          displayedRows.map((stock, idx) => {
            // Determine which icon to display based on category
            let assetImageSrc = null;
            if (stock.category === 'SATELLITES') {
              assetImageSrc = SatelliteIcon;
            } else if (stock.category === 'ETF') {
              assetImageSrc = EtfIcon;
            }
            // You can add more conditions here for other categories/images

            return (
              <Grid key={stock.symbol} item xs={12} md={4} lg={3}>
                <AssetFlipCard
                  stock={{
                    ...stock,
                    CP: stock.currentPrice,
                    CI: stock.CI, 
                    CV: stock.marketValue,
                  }}
                  assetImageSrc={assetImageSrc}
                  sx={{ animation: `slideUp 0.8s ease-out ${idx * 0.1}s both` }}
                />
              </Grid>
            );
          })
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