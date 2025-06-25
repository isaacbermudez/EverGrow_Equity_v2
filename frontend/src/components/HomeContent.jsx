// src/components/HomeContent.jsx
import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography
} from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { teal } from '@mui/material/colors';

import { Zap } from 'lucide-react';

import PortfolioAssets from './PortfolioAssets';
import PortfolioCharts from './PortfolioCharts';

export default function HomeContent({ data, handleAssets }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // State for the filter

  // Filter the data based on the selected category
  const filteredData = useMemo(() => {
    if (!data) {
      return [];
    }
    if (categoryFilter === 'ALL') {
      return data;
    }
    return data.filter(item => item.category === categoryFilter);
  }, [data, categoryFilter]);

  // THIS IS THE CRITICAL KEY PROP FOR ANIMATIONS
  // It changes whenever categoryFilter changes, forcing PortfolioCharts to remount
  const chartKey = categoryFilter;

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
      {/* Category Filter - Remains in HomeContent */}
      <ToggleButtonGroup
        color="primary"
        value={categoryFilter}
        exclusive
        onChange={(e, newValue) => newValue && setCategoryFilter(newValue)}
        size="small"
        sx={{
          mb: 4,
          '& .MuiToggleButton-root': {
            color: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease',
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.4) 0%, rgba(156, 39, 176, 0.4) 100%)',
              color: 'white'
            }
          }

        }}
      >
        <ToggleButton value="ALL">All</ToggleButton>
        {/*  <ToggleButton value="ETF">ETFs</ToggleButton> */}
        <ToggleButton value="SATELLITES">Satellites</ToggleButton>
      </ToggleButtonGroup>

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