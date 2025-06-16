// src/components/FinancialsSection.jsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
} from '@mui/material';

export default function FinancialsSection({ portfolioData = [] }) {
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" color="white" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
       Companies and Financials Overview
      </Typography>
    </Container>
  );
}