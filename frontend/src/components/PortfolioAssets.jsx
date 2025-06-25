// src/components/PortfolioAssets.jsx
import React, { useState, useEffect } from 'react';
import {
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Grid,
  Typography,
  Button // Import Button for pagination controls
} from '@mui/material';

import { TrendingUp, TrendingDown } from 'lucide-react';
// Corrected import paths for your images
import SatelliteIcon from '../assets/SATELLITE.png';
import EtfIcon from '../assets/ETF.png';
// Add more imports for other categories if you have them

// Import the new AssetFlipCard component
import AssetFlipCard from './AssetFlipCard';

// Helper: if not a number, fall back to 0
const safeNum = (n) => (typeof n === 'number' ? n : 0);

export default function PortfolioAssets({ rows = [] }) {
  const [currentPage, setCurrentPage] = useState('all'); // Changed default to 'all'
  // State to control animation re-trigger
  const [animateCards, setAnimateCards] = useState(false);

  const positivePLStocks = rows.filter(stock => safeNum(stock.profitLoss) >= 0);
  const negativePLStocks = rows.filter(stock => safeNum(stock.profitLoss) < 0);

  positivePLStocks.sort((a, b) => safeNum(b.profitLoss) - safeNum(a.profitLoss));
  negativePLStocks.sort((a, b) => safeNum(a.profitLoss) - safeNum(b.profitLoss));

  // Updated logic to handle 'all' case
  const displayedRows =
    currentPage === 'all'
      ? [...positivePLStocks, ...negativePLStocks] // Combine both arrays for 'all'
      : currentPage === 0
        ? positivePLStocks
        : negativePLStocks;

  // Effect to adjust currentPage if the active page becomes empty
  useEffect(() => {
    // Original logic for page switching - updated to handle 'all' case
    if (currentPage === 0 && positivePLStocks.length === 0 && negativePLStocks.length > 0) {
      setCurrentPage(1);
    } else if (currentPage === 1 && negativePLStocks.length === 0 && positivePLStocks.length > 0) {
      setCurrentPage(0);
    } else if ((currentPage === 0 || currentPage === 1) && positivePLStocks.length === 0 && negativePLStocks.length === 0) {
      // If both arrays are empty, switch to 'all' (which will also be empty but handles the empty state)
      setCurrentPage('all');
    }

    // New: Trigger animation when displayedRows (which depends on rows & currentPage) changes
    setAnimateCards(false); // Reset animation state
    const timer = setTimeout(() => {
      setAnimateCards(true); // Trigger animation after a slight delay
    }, 50); // Small delay to ensure CSS classes are removed then re-added
    return () => clearTimeout(timer); // Clean up timeout
  }, [rows, currentPage, positivePLStocks.length, negativePLStocks.length]); // Dependencies for this effect

  // Inject keyframes (this remains the same, run once)
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideUp { from {opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      .slide-up-initial { opacity: 0; transform: translateY(30px); }
      .slide-up-animate { animation: slideUp 0.8s ease-out both; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Box>
      {/* Pagination Controls - conditionally rendered */}
      <Box display="flex" justifyContent="center" mb={4}>
        <ToggleButtonGroup
          value={currentPage}
          exclusive
          onChange={(event, newPage) => {
            if (newPage !== null) {
              setCurrentPage(newPage);
            }
          }}
          sx={{
            '& .MuiToggleButton-root': {
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'inherit',
                borderColor: 'inherit'
              },
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.4) 0%, rgba(156, 39, 176, 0.4) 100%)',
                color: 'white',
                borderColor: 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.4) 0%, rgba(156, 39, 176, 0.4) 100%)',
                  color: 'white',
                  borderColor: 'transparent'
                }
              }
            }
          }}
        >
          <ToggleButton value="all">
            All ({positivePLStocks.length + negativePLStocks.length})
          </ToggleButton>
          {positivePLStocks.length > 0 && (
            <ToggleButton value={0}>
              <TrendingUp /> ({positivePLStocks.length})
            </ToggleButton>
          )}
          {negativePLStocks.length > 0 && (
            <ToggleButton value={1}>
              <TrendingDown />({negativePLStocks.length})
            </ToggleButton>
          )}
        </ToggleButtonGroup>
      </Box>
      
      {/* Holdings Grid - now displays based on currentPage */}
      <Grid container spacing={2}>
        {displayedRows.length > 0 ? (
          displayedRows.map((stock, idx) => {
            let assetImageSrc = null;
            if (stock.category === 'SATELLITES') {
              assetImageSrc = SatelliteIcon;
            } else if (stock.category === 'ETF') {
              assetImageSrc = EtfIcon;
            }

            return (
              <Grid
                key={stock.symbol}
                item
                xs={12}
                md={4}
                lg={3}
                // Apply classes conditionally to trigger animation
                className={animateCards ? 'slide-up-animate' : 'slide-up-initial'}
                sx={{ animationDelay: animateCards ? `${idx * 0.1}s` : '0s' }} // Apply delay only when animating
              >
                <AssetFlipCard
                  stock={{
                    ...stock,
                    CP: stock.currentPrice,
                    CI: stock.CI,
                    CV: stock.marketValue,
                  }}
                  assetImageSrc={assetImageSrc}
                />
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" color="text.secondary" textAlign="center" mt={4}>
              {/* Updated conditional message to handle 'all' case */}
              {positivePLStocks.length === 0 && negativePLStocks.length === 0
                ? "No positions to display."
                : currentPage === 'all'
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