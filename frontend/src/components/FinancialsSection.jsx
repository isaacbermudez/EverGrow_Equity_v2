// src/components/FinancialsSection.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Zap, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { teal, grey, green, red } from '@mui/material/colors';

// Constants for Local Storage Keys
const LOCAL_STORAGE_LAST_SEARCH_SYMBOL = 'lastSearchSymbol';
const LOCAL_STORAGE_COMPANY_PROFILE = 'companyProfile';
const LOCAL_STORAGE_FINANCIAL_METRICS = 'financialMetrics';
const LOCAL_STORAGE_BASIC_FINANCIALS = 'basicFinancials';

// Helper for safe number formatting
const safeNum = (n) => (typeof n === 'number' || typeof n === 'string' && !isNaN(parseFloat(n)) ? parseFloat(n) : 0);

// Helper to format large numbers (e.g., millions, billions)
const formatLargeNumber = (num, currency = true) => {
  const parsedNum = safeNum(num);
  if (parsedNum === 0 && num !== 0) return currency ? "$0.00" : "0.00";
  if (isNaN(parsedNum)) return '-';

  const absNum = Math.abs(parsedNum);
  let formatted;

  if (absNum >= 1_000_000_000_000) {
    formatted = (parsedNum / 1_000_000_000_000).toFixed(2) + 'T';
  } else if (absNum >= 1_000_000_000) {
    formatted = (parsedNum / 1_000_000_000).toFixed(2) + 'B';
  } else if (absNum >= 1_000_000) {
    formatted = (parsedNum / 1_000_000).toFixed(2) + 'M';
  } else if (absNum >= 1_000) {
    formatted = (parsedNum / 1_000).toFixed(2) + 'K';
  } else {
    formatted = parsedNum.toFixed(2);
  }

  return currency ? `$${formatted}` : formatted;
};

// Function to format percentage values, with color for positive/negative trends
const formatPercentage = (value) => {
  const num = safeNum(value);
  if (isNaN(num)) return '-';
  const color = num > 0 ? green[400] : num < 0 ? red[400] : grey[500];
  const icon = num > 0 ? <TrendingUp style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }} /> : num < 0 ? <TrendingDown style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }} /> : null;
  return (
    <Box component="span" sx={{ color: color, display: 'inline-flex', alignItems: 'center' }}>
      {icon}{`${num.toFixed(2)}%`}
    </Box>
  );
};

// --- FinancialHealthScorecard Component (No changes from previous iteration) ---
const FinancialHealthScorecard = React.memo(({ metrics, theme }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, fontWeight: 'bold' }}>
          Financial Health Analysis
        </Typography>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
          <Typography variant="body2" color="text.secondary">  Not enough data to generate the financial scorecard.</Typography>
        </Box>
      </Paper>
    );
  }

  const determineCompliance = (value, conditionType, target) => {
    if (value === undefined || value === null || value === "None" || value === "-") {
      return { status: 'N/A', icon: '-', color: grey[500] };
    }
    const numValue = safeNum(value);
    if (isNaN(numValue)) {
      return { status: 'N/A', icon: '-', color: grey[500] };
    }

    let complies = false;
    switch (conditionType) {
      case 'positive':
        complies = numValue > 0;
        break;
      case 'greater_than':
        complies = numValue > target;
        break;
      case 'less_than':
        complies = numValue < target;
        break;
      case 'less_than_or_equal':
        complies = numValue <= target;
        break;
      default:
        complies = false;
    }
    return {
      status: complies ? 'Sí' : 'No',
      icon: complies ? '✔️' : '❌',
      color: complies ? green[500] : red[500]
    };
  };

  const scorecardCategories = [
    {
      title: '💰 Profitability',
      indicators: [
        {
          label: 'Net Income (TTM)', key: 'ProfitMargin',
          target: 'Estable o creciente',
          currentVal: formatLargeNumber(metrics?.NetIncome || metrics?.netIncomeTTM, true),
          compliance: determineCompliance(metrics?.NetIncome || metrics?.netIncomeTTM, 'positive')
        },
        {
          label: 'Net Margin (TTM)', key: 'ProfitMargin',
          target: '> 15%',
          currentVal: formatPercentage(metrics?.ProfitMargin * 100),
          compliance: determineCompliance(metrics?.ProfitMargin * 100, 'greater_than', 15)
        },
        {
          label: 'ROE (TTM)', key: 'ReturnOnEquityTTM',
          target: '> 15%',
          currentVal: formatPercentage(metrics?.ReturnOnEquityTTM * 100),
          compliance: determineCompliance(metrics?.ReturnOnEquityTTM * 100, 'greater_than', 15)
        },
        {
          label: 'ROA (TTM)', key: 'ReturnOnAssetsTTM',
          target: '> 15%',
          currentVal: formatPercentage(metrics?.ReturnOnAssetsTTM * 100),
          compliance: determineCompliance(metrics?.ReturnOnAssetsTTM * 100, 'greater_than', 15)
        },
        {
          label: 'ROIC (TTM)', key: 'roiTTM',
          target: '> 20%',
          currentVal: formatPercentage(metrics?.roiTTM * 100),
          compliance: determineCompliance(metrics?.roiTTM * 100, 'greater_than', 20)
        },
      ]
    },
    {
      title: '📈 Growth',
      indicators: [
        {
          label: 'Revenue (TTM)', key: 'RevenueTTM',
          target: 'Estable o creciente',
          currentVal: formatLargeNumber(metrics?.RevenueTTM || metrics?.revenueTTM, true),
          compliance: determineCompliance(metrics?.RevenueTTM || metrics?.revenueTTM, 'positive')
        },
        { label: 'EPS Growth (5 años)', key: 'epsGrowth5Y', target: 'Positivo', currentVal: '-', compliance: { status: 'N/A', icon: '-', color: grey[500] } },
        { label: 'Sales Growth (5 años)', key: 'salesGrowth5Y', target: '> 10%', currentVal: '-', compliance: { status: 'N/A', icon: '-', color: grey[500] } },
        { label: 'Long-Term EPS Growth', key: 'longTermEpsGrowth', target: 'Positivo', currentVal: '-', compliance: { status: 'N/A', icon: '-', color: grey[500] } },
      ]
    },
    {
      title: '📊 Valuation',
      indicators: [
        {
          label: 'P/E Ratio', key: 'PERatio',
          target: '< 20 (o < 25)',
          currentVal: safeNum(metrics?.PERatio || metrics?.peTTM || metrics?.TrailingPE).toFixed(2),
          compliance: determineCompliance(safeNum(metrics?.PERatio || metrics?.peTTM || metrics?.TrailingPE), 'less_than_or_equal', 25)
        },
        {
          label: 'PEG Ratio', key: 'PEG Ratio',
          target: '< 1',
          currentVal: safeNum(metrics?.['PEG Ratio']).toFixed(2),
          compliance: determineCompliance(metrics?.['PEG Ratio'], 'less_than', 1)
        },
        {
          label: 'P/B Ratio', key: 'PriceToBookRatio',
          target: '< 2',
          currentVal: safeNum(metrics?.PriceToBookRatio).toFixed(2),
          compliance: determineCompliance(metrics?.PriceToBookRatio, 'less_than', 2)
        },
      ]
    },
    {
      title: '🧮 Financial Strength (Debt and Liquidity)',
      indicators: [
        { label: 'Net Debt / EBITDA', key: 'NetDebtEBITDA', target: '< 3x', currentVal: '-', compliance: { status: 'N/A', icon: '-', color: grey[500] } },
        {
          label: 'Debt/Equity (Annual)', key: 'totalDebt/totalEquityAnnual',
          target: '< 1',
          currentVal: safeNum(metrics?.['totalDebt/totalEquityAnnual']).toFixed(2),
          compliance: determineCompliance(metrics?.['totalDebt/totalEquityAnnual'], 'less_than', 1)
        },
        {
          label: 'Quick Ratio (Annual)', key: 'quickRatioAnnual',
          target: '> 1',
          currentVal: safeNum(metrics?.quickRatioAnnual).toFixed(2),
          compliance: determineCompliance(metrics?.quickRatioAnnual, 'greater_than', 1)
        },
      ]
    },
    {
      title: '💸 Dividends',
      indicators: [
        {
          label: 'Dividend Yield', key: 'DividendYield',
          target: '> 0% (si aplica)',
          currentVal: formatPercentage(metrics?.DividendYield * 100),
          compliance: determineCompliance(metrics?.DividendYield * 100, 'greater_than', 0)
        },
        { label: 'Payout Ratio', key: 'PayoutRatio', target: '< 60%', currentVal: '-', compliance: { status: 'N/A', icon: '-', color: grey[500] } },
      ]
    },
  ].filter(category => category.indicators.some(ind => ind.currentVal !== '-' && ind.currentVal !== '$0.00' && ind.currentVal !== '0.00%'));

  if (scorecardCategories.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, fontWeight: 'bold' }}>
          Análisis de Salud Financiera
        </Typography>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
          <Typography variant="body2" color="text.secondary">No hay suficientes datos para generar el cuadro de mando financiero.</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, fontWeight: 'bold' }}>
        Análisis de Salud Financiera
      </Typography>
      <Grid container spacing={3}>
        {scorecardCategories.map((category, catIndex) => (
          <Grid item xs={12} md={6} key={catIndex}>
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.background.default }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
                {category.title}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Indicator</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Current</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Target / Expected</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}` }}>Complies</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {category.indicators.map((indicator, indIndex) => (
                      <TableRow key={indIndex}>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{indicator.label}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>{indicator.currentVal}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>{indicator.target}</TableCell>
                        <TableCell align="center" sx={{ color: indicator.compliance.color }}>
                          {indicator.compliance.icon} {indicator.compliance.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
});

FinancialHealthScorecard.displayName = 'FinancialHealthScorecard';

// --- RENAMED & MODIFIED COMPONENT: OtherFinancialDetailsTable (Grouped) ---
const OtherFinancialDetailsTable = React.memo(({ metrics, theme }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return <Typography variant="body2" color="text.secondary">No additional detailed metrics available.</Typography>;
  }

  const scorecardKeys = [
    'NetIncome', 'netIncomeTTM',
    'ProfitMargin',
    'ReturnOnEquityTTM',
    'ReturnOnAssetsTTM',
    'roiTTM',
    'RevenueTTM', 'revenueTTM',
    'PERatio', 'peTTM', 'TrailingPE',
    'PEG Ratio',
    'PriceToBookRatio',
    'totalDebt/totalEquityAnnual',
    'quickRatioAnnual',
    'DividendYield',
  ];

  const groupedMetrics = [
    {
      title: 'General Company Info',
      display: [
        { key: 'ipo', label: 'IPO Date', format: (val) => val },
        { key: 'phone', label: 'Phone', format: (val) => val },
        { key: 'SharesOutstanding', label: 'Shares Outstanding', format: (val) => formatLargeNumber(val, false) },
        { key: 'FiscalYearEnd', label: 'Fiscal Year End', format: (val) => val },
        { key: 'LatestQuarter', label: 'Latest Quarter', format: (val) => val },
        { key: 'Description', label: 'Description', format: (val) => val === "None" ? "-" : val },
        { key: 'Address', label: 'Address', format: (val) => val },
      ]
    },
    {
      title: 'Rendimiento del Precio',
      keys: ['52WeekHigh', '52WeekLow', '52WeekHighDate', '52WeekLowDate', '200DayMovingAverage', '50DayMovingAverage',
        'monthToDatePriceReturnDaily', 'yearToDatePriceReturnDaily', '5DayPriceReturnDaily', '13WeekPriceReturnDaily',
        '26WeekPriceReturnDaily', 'beta'],
      display: [
        { key: '52WeekHigh', label: 'Máximo 52 Semanas', format: (val) => formatLargeNumber(val, true) },
        { key: '52WeekLow', label: 'Mínimo 52 Semanas', format: (val) => formatLargeNumber(val, true) },
        { key: '52WeekHighDate', label: 'Fecha Máximo 52 Semanas', format: (val) => val },
        { key: '52WeekLowDate', label: 'Fecha Mínimo 52 Semanas', format: (val) => val },
        { key: '200DayMovingAverage', label: 'Media Móvil 200 Días', format: (val) => formatLargeNumber(val, true) },
        { key: '50DayMovingAverage', label: 'Media Móvil 50 Días', format: (val) => formatLargeNumber(val, true) },
        { key: 'monthToDatePriceReturnDaily', label: 'Retorno Mensual', format: (val) => formatPercentage(val) },
        { key: 'yearToDatePriceReturnDaily', label: 'Retorno Anual (YTD)', format: (val) => formatPercentage(val) },
        { key: '5DayPriceReturnDaily', label: 'Retorno 5 Días', format: (val) => formatPercentage(val) },
        { key: '13WeekPriceReturnDaily', label: 'Retorno 13 Semanas', format: (val) => formatPercentage(val) },
        { key: '26WeekPriceReturnDaily', label: 'Retorno 26 Semanas', format: (val) => formatPercentage(val) },
        { key: 'beta', label: 'Beta', format: (val) => safeNum(val).toFixed(2) },
      ]
    },
    {
      title: 'Otros Ratios',
      keys: ['PriceToSalesRatioTTM', 'EPS', 'DilutedEPSTTM', 'RevenuePerShareTTM', 'GrossProfitTTM', 'grossMarginTTM',
        'OperatingMarginTTM', 'EBITDA', 'EVToEBITDA', 'EVToRevenue', 'QuarterlyEarningsGrowthYOY',
        'QuarterlyRevenueGrowthYOY', 'currentRatioAnnual', 'BookValue'],
      display: [
        { key: 'PriceToSalesRatioTTM', label: 'Ratio P/Ventas (TTM)', format: (val) => safeNum(val).toFixed(2) },
        { key: 'EPS', label: 'EPS (TTM)', format: (val) => formatLargeNumber(val, true) },
        { key: 'DilutedEPSTTM', label: 'EPS Diluido (TTM)', format: (val) => formatLargeNumber(val, true) },
        { key: 'RevenuePerShareTTM', label: 'Ingresos por Acción (TTM)', format: (val) => formatLargeNumber(val, true) },
        { key: 'GrossProfitTTM', label: 'Ganancia Bruta (TTM)', format: (val) => formatLargeNumber(val, true) },
        { key: 'grossMarginTTM', label: 'Margen Bruto (TTM)', format: (val) => formatPercentage(val * 100) },
        { key: 'OperatingMarginTTM', label: 'Margen Operativo (TTM)', format: (val) => formatPercentage(val * 100) },
        { key: 'EBITDA', label: 'EBITDA (TTM)', format: (val) => formatLargeNumber(val, true) },
        { key: 'EVToEBITDA', label: 'EV/EBITDA', format: (val) => val === "-" ? "-" : safeNum(val).toFixed(2) },
        { key: 'EVToRevenue', label: 'EV/Ingresos', format: (val) => safeNum(val).toFixed(2) },
        { key: 'QuarterlyEarningsGrowthYOY', label: 'Crecimiento Ganancias Trimestral YoY', format: (val) => formatPercentage(val * 100) },
        { key: 'QuarterlyRevenueGrowthYOY', label: 'Crecimiento Ingresos Trimestral YoY', format: (val) => formatPercentage(val * 100) },
        { key: 'currentRatioAnnual', label: 'Ratio Actual (Anual)', format: (val) => safeNum(val).toFixed(2) },
        { key: 'BookValue', label: 'Valor Contable', format: (val) => formatLargeNumber(val, true) },
      ]
    },
    {
      title: 'Detalles de Dividendos',
      keys: ['DividendPerShare', 'DividendDate', 'ExDividendDate'],
      display: [
        { key: 'DividendPerShare', label: 'Dividendo por Acción', format: (val) => val === "None" ? "-" : formatLargeNumber(val, true) },
        { key: 'DividendDate', label: 'Fecha de Dividendo', format: (val) => val === "None" ? "-" : val },
        { key: 'ExDividendDate', label: 'Fecha Ex-Dividendo', format: (val) => val === "None" ? "-" : val },
      ]
    }
  ];

  const hasRelevantMetrics = groupedMetrics.some(group =>
    group.display.some(metric => {
      // Check if the metric key is NOT in scorecardKeys and has a valid value
      return !scorecardKeys.includes(metric.key) &&
        (metrics?.[metric.key] !== undefined && metrics?.[metric.key] !== null && metrics?.[metric.key] !== "None" && metrics?.[metric.key] !== "-");
    })
  );

  if (!hasRelevantMetrics) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
        <Typography variant="body2" color="text.secondary">  No other financial details available to display.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {groupedMetrics.map((group, groupIndex) => {
        const relevantGroupMetrics = group.display.filter(metric =>
          // Only include metrics that are not in the scorecard and have data
          !scorecardKeys.includes(metric.key) &&
          (metrics?.[metric.key] !== undefined && metrics?.[metric.key] !== null && metrics?.[metric.key] !== "None" && metrics?.[metric.key] !== "-")
        );

        if (relevantGroupMetrics.length === 0) {
          return null; // Skip rendering empty groups
        }

        return (
          <Grid item xs={12} md={6} key={groupIndex}>
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.background.default }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
                {group.title}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {relevantGroupMetrics.map((metric, metricIndex) => (
                      <TableRow key={metric.key}>
                        <TableCell sx={{ color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}` }}>{metric.label}</TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.secondary, borderBottom: `1px solid ${theme.palette.divider}` }}>
                          {metric.format(metrics?.[metric.key])}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
});

OtherFinancialDetailsTable.displayName = 'OtherFinancialDetailsTable';


// Company Header Card (No changes)
const CompanyHeaderCard = React.memo(({ companyProfile, basicFinancials, theme }) => {
  if (!companyProfile && !basicFinancials) return null;

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
      {companyProfile?.logo && companyProfile.logo !== "" ? (
        <img src={companyProfile.logo} alt={`${companyProfile.name} logo`} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'contain', border: `2px solid ${theme.palette.divider}`, flexShrink: 0 }} />
      ) : (
        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: theme.palette.action.selected, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Typography variant="h4" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>
            {companyProfile?.ticker?.[0] || basicFinancials?.Symbol?.[0] || '?'}
          </Typography>
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
          {companyProfile?.name || basicFinancials?.Name || 'N/A'} ({companyProfile?.ticker || basicFinancials?.Symbol || 'N/A'})
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
          {companyProfile?.exchange || basicFinancials?.Exchange || 'N/A'} {companyProfile?.currency && `- ${companyProfile.currency}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Industry: {companyProfile?.finnhubIndustry || basicFinancials?.Industry || 'N/A'} {basicFinancials?.Sector && `(${basicFinancials.Sector})`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Country: {companyProfile?.country || basicFinancials?.Country || 'N/A'}
        </Typography>
        {(companyProfile?.weburl || basicFinancials?.OfficialSite) && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Website: <a href={companyProfile?.weburl || basicFinancials?.OfficialSite} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.light, textDecoration: 'none' }}>
              {companyProfile?.weburl || basicFinancials?.OfficialSite}
            </a>
          </Typography>
        )}
      </Box>
    </Paper>
  );
});

CompanyHeaderCard.displayName = 'CompanyHeaderCard';


// Analyst Coverage Section (No changes)
const AnalystCoverageCard = React.memo(({ basicFinancials, theme }) => {
  if (!basicFinancials || (!basicFinancials.AnalystTargetPrice && !basicFinancials.AnalystRatingStrongBuy && !basicFinancials.AnalystRatingBuy && !basicFinancials.AnalystRatingHold && !basicFinancials.AnalystRatingSell && !basicFinancials.AnalystRatingStrongSell)) {
    return null;
  }

  const getChipColor = (ratingType) => {
    switch (ratingType) {
      case 'Strong Buy': return green[700];
      case 'Buy': return green[500];
      case 'Hold': return grey[600];
      case 'Sell': return red[500];
      case 'Strong Sell': return red[700];
      default: return theme.palette.text.secondary;
    }
  };

  const getChipTextColor = (ratingType) => {
    switch (ratingType) {
      case 'Strong Buy':
      case 'Buy':
      case 'Strong Sell':
      case 'Sell':
        return theme.palette.getContrastText(getChipColor(ratingType));
      default:
        return theme.palette.text.primary;
    }
  };

  const analystRatings = [
    { label: 'Strong Buy', value: basicFinancials.AnalystRatingStrongBuy },
    { label: 'Buy', value: basicFinancials.AnalystRatingBuy },
    { label: 'Hold', value: basicFinancials.AnalystRatingHold },
    { label: 'Sell', value: basicFinancials.AnalystRatingSell },
    { label: 'Strong Sell', value: basicFinancials.AnalystRatingStrongSell },
  ].filter(rating => safeNum(rating.value) > 0);

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
        <Target size={24} style={{ marginRight: 8, color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Analyst Coverage
        </Typography>
      </Box>
      <Grid container spacing={2} alignItems="center">
        {basicFinancials.AnalystTargetPrice && basicFinancials.AnalystTargetPrice !== "None" && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme.palette.action.hover, p: 1.5, borderRadius: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1, fontWeight: 'medium' }}>Target Price:</Typography>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {formatLargeNumber(basicFinancials.AnalystTargetPrice, true)}
              </Typography>
            </Box>
          </Grid>
        )}
        {analystRatings.length > 0 && (
          <Grid item xs={12} sm={basicFinancials.AnalystTargetPrice ? 6 : 12}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>Current Ratings:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {analystRatings.map((rating) => (
                <Chip
                  key={rating.label}
                  label={`${rating.label}: ${rating.value}`}
                  size="small"
                  sx={{
                    bgcolor: getChipColor(rating.label),
                    color: getChipTextColor(rating.label),
                    fontWeight: 'bold',
                    '& .MuiChip-label': { px: 1, py: 0.25 },
                  }}
                />
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
});

AnalystCoverageCard.displayName = 'AnalystCoverageCard';


export default function FinancialsSection({ portfolioData = [] }) {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [basicFinancials, setBasicFinancials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Get unique symbols from portfolioData for Autocomplete options
  const portfolioSymbols = useMemo(() => {
    return Array.from(new Set(
      portfolioData
        .filter(asset => asset.category !== 'ETF' && asset.symbol) // Filter out ETFs and ensure symbol exists
        .map(asset => asset.symbol)
    ));
  }, [portfolioData]);

  // Function to save data to local storage
  const saveDataToLocalStorage = useCallback((symbol, profile, metrics, basic) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LAST_SEARCH_SYMBOL, symbol);
      localStorage.setItem(LOCAL_STORAGE_COMPANY_PROFILE, JSON.stringify(profile));
      localStorage.setItem(LOCAL_STORAGE_FINANCIAL_METRICS, JSON.stringify(metrics));
      localStorage.setItem(LOCAL_STORAGE_BASIC_FINANCIALS, JSON.stringify(basic));
    } catch (e) {
      console.error("Error saving to local storage:", e);
    }
  }, []);

  // Function to load data from local storage
  const loadDataFromLocalStorage = useCallback((symbol) => {
    try {
      const profile = JSON.parse(localStorage.getItem(LOCAL_STORAGE_COMPANY_PROFILE));
      const metrics = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FINANCIAL_METRICS));
      const basic = JSON.parse(localStorage.getItem(LOCAL_STORAGE_BASIC_FINANCIALS));

      const lastSearched = localStorage.getItem(LOCAL_STORAGE_LAST_SEARCH_SYMBOL);
      if (lastSearched === symbol && profile && metrics && basic) {
        return { profile, metrics, basic };
      }
      return { profile: null, metrics: null, basic: null };
    } catch (e) {
      console.error("Error loading from local storage:", e);
      return { profile: null, metrics: null, basic: null };
    }
  }, []);

  // Function to clear data from local storage
  const clearDataFromLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_LAST_SEARCH_SYMBOL);
      localStorage.removeItem(LOCAL_STORAGE_COMPANY_PROFILE);
      localStorage.removeItem(LOCAL_STORAGE_FINANCIAL_METRICS);
      localStorage.removeItem(LOCAL_STORAGE_BASIC_FINANCIALS);
    } catch (e) {
      console.error("Error clearing from local storage:", e);
    }
  }, []);


  // Handle search logic
  const handleSearch = useCallback(async (symbolToFetch) => {
    const symbol = symbolToFetch ? symbolToFetch.toUpperCase() : '';

    if (!symbol) {
      setError("Please enter a valid stock symbol.");
      setCompanyProfile(null);
      setFinancialMetrics(null);
      setBasicFinancials(null);
      clearDataFromLocalStorage();
      setSelectedSymbol(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCompanyProfile(null);
    setFinancialMetrics(null);
    setBasicFinancials(null);

    try {
      const { profile, metrics, basic } = loadDataFromLocalStorage(symbol);

      if (profile && metrics && basic) {
        setCompanyProfile(profile);
        setFinancialMetrics(metrics);
        setBasicFinancials(basic);
        setSelectedSymbol(symbol);
        setSearchSymbol(symbol);
        setLoading(false);
        console.log(`Loaded data for ${symbol} from local storage.`);
        return;
      }

      const profileResponse = await fetch(`/api/company-profile?symbol=${symbol}`);
      const profileJson = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileJson.error || `Failed to fetch company profile for ${symbol}.`);
      }
      setCompanyProfile(profileJson);

      const metricsResponse = await fetch(`/api/stock-metrics?symbol=${symbol}`);
      const metricsJson = await metricsResponse.json();

      if (!metricsResponse.ok) {
        console.warn(`Failed to fetch stock metrics for ${symbol}:`, metricsJson.error);
      }
      const fetchedStockMetrics = metricsJson.metric || {};

      const basicFinancialsResponse = await fetch(`/api/basic-financials?symbol=${symbol}`);
      const basicFinancialsJson = await basicFinancialsResponse.json();

      if (!basicFinancialsResponse.ok) {
        console.warn(`Failed to fetch basic financials for ${symbol}:`, basicFinancialsJson.error);
      }
      setBasicFinancials(basicFinancialsJson);

      const combinedMetrics = {
        ...profileJson,
        ...fetchedStockMetrics,
        ...basicFinancialsJson
      };
      setFinancialMetrics(combinedMetrics);
      setSelectedSymbol(symbol);

      saveDataToLocalStorage(symbol, profileJson, combinedMetrics, basicFinancialsJson);

    } catch (err) {
      console.error("Error fetching financial data:", err);
      setError(`Failed to load data: ${err.message}`);
      setCompanyProfile(null);
      setFinancialMetrics(null);
      setBasicFinancials(null);
      clearDataFromLocalStorage();
      setSelectedSymbol(null);
    } finally {
      setLoading(false);
    }
  }, [loadDataFromLocalStorage, saveDataToLocalStorage, clearDataFromLocalStorage]);

  // Effect to load last searched symbol on component mount
  useEffect(() => {
    const lastSymbol = localStorage.getItem(LOCAL_STORAGE_LAST_SEARCH_SYMBOL);
    if (lastSymbol) {
      const { profile, metrics, basic } = loadDataFromLocalStorage(lastSymbol);
      if (profile && metrics && basic) {
        setCompanyProfile(profile);
        setFinancialMetrics(metrics);
        setBasicFinancials(basic);
        setSearchSymbol(lastSymbol);
        setSelectedSymbol(lastSymbol);
      } else {
        clearDataFromLocalStorage();
      }
    }
  }, []);

  // Effect to trigger search when selectedSymbol changes
  useEffect(() => {
    if (selectedSymbol) {
      handleSearch(selectedSymbol);
    }
  }, [selectedSymbol, handleSearch]);


  // Handle Autocomplete input change
  const handleAutocompleteInputChange = (event, newInputValue, reason) => {
    setSearchSymbol(newInputValue);
    if (reason === 'clear' || newInputValue === '') {
      setSelectedSymbol(null);
      setCompanyProfile(null);
      setFinancialMetrics(null);
      setBasicFinancials(null);
      clearDataFromLocalStorage();
      setError(null);
    }
  };

  // Effect for cleaning up on empty portfolioData
  useEffect(() => {
    const hasRelevantSymbolsInPortfolio = portfolioData.some(asset => asset.symbol);

    if (portfolioData.length === 0 || !hasRelevantSymbolsInPortfolio) {
      console.log("Portfolio data is empty or has no symbols, clearing financial search/display.");
      setSearchSymbol('');
      setSelectedSymbol(null);
      setCompanyProfile(null);
      setFinancialMetrics(null);
      setBasicFinancials(null);
      setError(null);
      clearDataFromLocalStorage();
    }
  }, [portfolioData, clearDataFromLocalStorage]);


  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Title Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
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
            justifyContent: 'center'
          }}
        >
          <Zap size={24} color="#f9a825" style={{ marginRight: 10 }} /> Financial Insights
        </Typography>
      </Box>

      {/* Search Bar Card */}
      <Paper elevation={4} sx={{ p: 3, mb: 4, bgcolor: theme.palette.background.paper, borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Autocomplete
            freeSolo
            options={portfolioSymbols}
            value={searchSymbol}
            onInputChange={handleAutocompleteInputChange}
            onChange={(event, newValue) => {
              setSelectedSymbol(newValue);
              setSearchSymbol(newValue || '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Enter Stock Symbol (e.g., AAPL, MSFT)"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: teal[400] },
                    '&.Mui-focused fieldset': { borderColor: teal[500], borderWidth: '2px' },
                  },
                  '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                  '& .MuiInputBase-input': { color: theme.palette.text.primary },
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchSymbol.toUpperCase());
                  }
                }}
              />
            )}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => handleSearch(searchSymbol.toUpperCase())}
            endIcon={<SearchIcon />}
            sx={{
              bgcolor: teal[600],
              '&:hover': {
                bgcolor: teal[700],
                boxShadow: '0 4px 15px rgba(0,128,128,0.4)',
              },
              p: '15px 25px',
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 2px 10px rgba(0,128,128,0.2)',
            }}
          >
            Analyze
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={60} thickness={5} sx={{ color: teal[500] }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, py: 2, px: 3, boxShadow: '0 2px 10px rgba(255,0,0,0.1)' }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>Error:</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {!loading && !error && financialMetrics && (
        <Box>
          {/* Company Header Card */}
          <CompanyHeaderCard companyProfile={companyProfile} basicFinancials={basicFinancials} theme={theme} />

          {/* Key Metrics Snapshot */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, fontWeight: 'bold' }}>
              Snapshot
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2, borderLeft: `4px solid ${teal[500]}` }}>
                  <Typography variant="subtitle2" color="text.secondary">Market Cap</Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    {formatLargeNumber(financialMetrics?.MarketCapitalization || financialMetrics?.marketCapitalization, true)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2, borderLeft: `4px solid ${teal[500]}` }}>
                  <Typography variant="subtitle2" color="text.secondary">P/E Ratio (TTM)</Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    {safeNum(financialMetrics?.PERatio || financialMetrics?.peTTM || financialMetrics?.TrailingPE).toFixed(2) || '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2, borderLeft: `4px solid ${teal[500]}` }}>
                  <Typography variant="subtitle2" color="text.secondary">EPS (TTM)</Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    {formatLargeNumber(financialMetrics?.EPS || financialMetrics?.epsTTM || financialMetrics?.DilutedEPSTTM, true)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2, borderLeft: `4px solid ${teal[500]}` }}>
                  <Typography variant="subtitle2" color="text.secondary">52 Week High</Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    {formatLargeNumber(financialMetrics?.['52WeekHigh'], true)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2, borderLeft: `4px solid ${teal[500]}` }}>
                  <Typography variant="subtitle2" color="text.secondary">52 Week Low</Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    {formatLargeNumber(financialMetrics?.['52WeekLow'], true)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2, borderLeft: `4px solid ${teal[500]}` }}>
                  <Typography variant="subtitle2" color="text.secondary">Revenue (TTM)</Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    {formatLargeNumber(financialMetrics?.RevenueTTM || financialMetrics?.revenueTTM, true)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Analyst Coverage Card */}
          <AnalystCoverageCard basicFinancials={basicFinancials} theme={theme} />

          {/* Financial Health Scorecard */}
          <FinancialHealthScorecard metrics={financialMetrics} theme={theme} />

          {/* Other Financial Details Table (now grouped) */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, fontWeight: 'bold' }}>
              Other Financial Details
            </Typography>
            <OtherFinancialDetailsTable metrics={financialMetrics} theme={theme} />
          </Paper>
        </Box>
      )}

      {!loading && !error && !financialMetrics && selectedSymbol && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: 2, py: 2, px: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>No Data Found:</Typography>
          <Typography variant="body2">
            We could not retrieve comprehensive financial data for "{selectedSymbol}".
            This might be due to an invalid symbol, or data not being available for this entity. Please try a different symbol.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}