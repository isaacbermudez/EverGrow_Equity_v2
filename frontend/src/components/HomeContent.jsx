// src/components/HomeContent.jsx
import React from 'react';
import {
  Container,
  Paper,
  Grid,
  Box,
  Typography
} from '@mui/material';
import PortfolioAssets from './PortfolioAssets';
import PortfolioCharts from './PortfolioCharts';

export default function HomeContent({ data, handleAssets }) {
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
      {/* Section for PortfolioCharts */}
      <Grid container spacing={3} sx={{ width: '100%', mb: 4 }}>
        <Grid item xs={12}>
          <PortfolioCharts rows={data} />
        </Grid>
      </Grid>

      {/* Section for PortfolioAssets */}
      <Grid container spacing={3} sx={{ width: '100%' }}>
            <PortfolioAssets rows={data} />
      </Grid>
    </Container>
  );
}
