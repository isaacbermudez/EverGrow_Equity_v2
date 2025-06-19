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
        <Grid item xs={12}>
          <Paper
            elevation={6}
            sx={{
              p: 3,
              width: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 3,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 30px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.2)'
              }
            }}
          >
            <PortfolioAssets rows={data} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
