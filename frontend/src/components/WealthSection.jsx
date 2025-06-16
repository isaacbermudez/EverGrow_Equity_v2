// src/components/WealthSection.jsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
} from '@mui/material';

export default function WealthSection({ portfolioData = [] }) {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" color="white" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Family Wealth Overview
      </Typography>
    </Container>
  );
}