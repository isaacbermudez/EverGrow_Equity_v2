// src/components/HomeContent.jsx
import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Box
} from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { teal } from '@mui/material/colors';

import { Zap, Search } from 'lucide-react';

import PortfolioAssets from './PortfolioAssets';
import PortfolioCharts from './PortfolioCharts';

export default function HomeContent({ data, handleAssets }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // State for category filter
  const [symbolFilter, setSymbolFilter] = useState(''); // State for symbol filter

  // Filter the data based on the selected category and symbol
  const filteredData = useMemo(() => {
    if (!data) {
      return [];
    }

    let filtered = data;

    // Apply category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply symbol filter
    if (symbolFilter.trim() !== '') {
      filtered = filtered.filter(item =>
        item.symbol && item.symbol.toLowerCase().includes(symbolFilter.toLowerCase().trim())
      );
    }

    return filtered;
  }, [data, categoryFilter, symbolFilter]);

  // THIS IS THE CRITICAL KEY PROP FOR ANIMATIONS
  // It changes whenever filters change, forcing PortfolioCharts to remount
  const chartKey = `${categoryFilter}-${symbolFilter}`;

  // Get unique symbols for autocomplete suggestions (optional)
  const availableSymbols = useMemo(() => {
    if (!data) return [];
    const symbols = data
      .filter(item => item.symbol)
      .map(item => item.symbol)
      .filter((symbol, index, arr) => arr.indexOf(symbol) === index)
      .sort();
    return symbols;
  }, [data]);

  const handleSymbolFilterChange = (event) => {
    setSymbolFilter(event.target.value);
  };

  const clearSymbolFilter = () => {
    setSymbolFilter('');
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 0,
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mx: 'auto',
        flexGrow: 1,
        py: 2,
      }}
    >
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
          mb: 3
        }}
      >
        <Zap size={28} color="#f9a825" style={{ marginRight: 12 }} />
        Portfolio Dashboard
      </Typography>

      {/* Filters Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 4 }}>
        {/* Category Filter */}
        <ToggleButtonGroup
          color="primary"
          value={categoryFilter}
          exclusive
          onChange={(e, newValue) => newValue && setCategoryFilter(newValue)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.9)',
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.8) 0%, rgba(156, 39, 176, 0.8) 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)'
              }
            }
          }}
        >
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="SATELLITES">Satellites</ToggleButton>
        </ToggleButtonGroup>

        {/* Symbol Filter */}
        <TextField
          label="Filter by Symbol"
          variant="outlined"
          size="small"
          value={symbolFilter}
          onChange={handleSymbolFilterChange}
          placeholder="e.g. AAPL, TSLA"
          InputProps={{
            startAdornment: <Search size={18} style={{ marginRight: 8, color: 'rgba(255,255,255,0.6)' }} />,
          }}
          sx={{
            width: '250px',
            '& .MuiOutlinedInput-root': {
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.05)',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00C49F',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-focused': {
                color: '#00C49F',
              },
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'rgba(255,255,255,0.5)',
            }
          }}
        />

        {/* Filter Results Summary */}
        {(categoryFilter !== 'ALL' || symbolFilter.trim() !== '') && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            Showing {filteredData.length} results
            {categoryFilter !== 'ALL' && ` • Category: ${categoryFilter}`}
            {symbolFilter.trim() !== '' && ` • Symbol: "${symbolFilter}"`}
            <span
              onClick={() => {
                setCategoryFilter('ALL');
                setSymbolFilter('');
              }}
              style={{
                cursor: 'pointer',
                textDecoration: 'underline',
                color: '#00C49F'
              }}
            >
              Clear all
            </span>
          </Typography>
        )}
      </Box>

      {/* Section for PortfolioCharts */}
      <Grid container spacing={3} sx={{ width: '100%', mb: 4, minHeight: '450px' }}>
        <Grid item xs={12}>
          {/* Pass filteredData and the chartKey to PortfolioCharts */}
          <PortfolioCharts key={chartKey} rows={filteredData} />
        </Grid>
      </Grid>

      {/* Section for PortfolioAssets */}
      <Grid container spacing={3} sx={{ width: '100%' }}>
        <Grid item xs={12}>
          <PortfolioAssets rows={filteredData} /> {/* PortfolioAssets also receives filteredData */}
        </Grid>
      </Grid>
    </Container>
  );
}
