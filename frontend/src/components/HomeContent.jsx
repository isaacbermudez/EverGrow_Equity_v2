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
      }}
    >
      {/* Combined Grid for PortfolioCharts, and PortfolioAssets */}
      <Grid container spacing={3} sx={{ width: '100%', mb: 4 }}>

        {/* PortfolioCharts and PortfolioAssets will take the remaining space */}
        <Grid item xs={12} sm={6} md={8} lg={9}> {/* This Grid item takes the remaining space */}
          <Grid container spacing={3}> {/* Nested Grid to arrange Charts and Assets side-by-side */}
            <Grid item xs={12} md={6}> {/* Half of the md=8 for Charts */}
              <Paper elevation={3} sx={{ p: 3, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <PortfolioCharts rows={data} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}> {/* Half of the md=8 for Assets */}
              <Paper elevation={3} sx={{ p: 3, width: '100%', height: '100%' }}>
                <PortfolioAssets rows={data} />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}