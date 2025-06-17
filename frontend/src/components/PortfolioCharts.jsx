// src/components/PortfolioCharts.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap } from 'lucide-react';
import { teal } from '@mui/material/colors';

const safeNum = (n) => (typeof n === 'number' ? n : 0);

const COLORS = [
  teal[500], '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6384',
  '#36A2EB', '#FFCE56', '#8A2BE2', '#00CED1', '#FF4500', '#DA70D6',
  '#E0BBE4', '#957DAD', '#D291BC', '#FFC72C', '#FF6B6B', '#7A73F0'
];

const renderCustomizedLabel = () => null;

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box sx={{ p: 1.5, background: 'rgba(0,0,0,0.85)', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>{data.name}</Typography>
        <Typography variant="caption" sx={{ color: teal[300] }}>
          ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
        <Typography variant="caption" sx={{ color: '#FFBB28' }}>
          {((data.value / data.total) * 100).toFixed(1)}%
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function PortfolioCharts({ rows = [] }) {
  const theme = useTheme();
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredRows = rows.filter(stock => categoryFilter === 'ALL' || stock.category === categoryFilter);

  const totalValue = filteredRows.reduce((acc, stock) => acc + (safeNum(stock.currentPrice) * safeNum(stock.holdings)), 0);
  const totalInvestedAmount = filteredRows.reduce((acc, stock) => acc + safeNum(stock.CI), 0);

  const sectorData = filteredRows.reduce((acc, stock) => {
    const sector = stock.sector || 'Uncategorized';
    const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
    acc[sector] = (acc[sector] || 0) + marketValue;
    return acc;
  }, {});

  const baseChartData = Object.entries(sectorData)
    .map(([name, value]) => ({ name, value, total: totalValue }))
    .filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const investedChartData = filteredRows
    .map(stock => ({
      name: stock.symbol || 'N/A',
      value: safeNum(stock.CI),
      total: totalInvestedAmount
    }))
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value);

  const ChartCard = ({ title, data, dataKey = 'value' }) => {
    const [activeItems, setActiveItems] = useState(data.map(() => true));
    const toggleItem = (index) => {
      const updated = [...activeItems];
      updated[index] = !updated[index];
      setActiveItems(updated);
    };
    const visibleData = data.map((entry, index) => ({ ...entry, index })).filter((_, i) => activeItems[i]);

    if (!data.length) {
      return (
        <Box sx={{ flex: 1, minWidth: 320, maxWidth: 500, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
          <img src="/no-data.svg" alt="No data" style={{ maxWidth: 140, opacity: 0.5, marginBottom: 16 }} />
          <Typography variant="body2" color="text.secondary">No data to display</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, minWidth: 320, maxWidth: 500, p: 1 }}> 
        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>{title}</Typography>
        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visibleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey={dataKey}
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {visibleData.map((entry, i) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[entry.index % COLORS.length]}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 1, maxHeight: 60, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
          {data.map((entry, index) => (
            <MuiTooltip key={index} title={activeItems[index] ? 'Click to hide' : 'Click to show'} arrow>
              <Box
                onClick={() => toggleItem(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  opacity: activeItems[index] ? 1 : 0.35,
                  px: 0.8,
                  py: 0.3,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length], mr: 0.6 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', fontWeight: 500 }}>{entry.name}</Typography>
              </Box>
            </MuiTooltip>
          ))}
        </Box>
      </Box>
    );
  };

  const hasData = baseChartData.length > 0 || investedChartData.length > 0;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            color: 'white',
            fontWeight: 800,
            background: 'linear-gradient(45deg, #00C49F, #0088FE, #FFBB28)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}
        >
          <Zap size={18} color="#f9a825" style={{ marginRight: 8 }} /> Portfolio Status
        </Typography>
        {hasData && (
          <ToggleButtonGroup
            color="primary"
            value={categoryFilter}
            exclusive
            onChange={(e, newValue) => newValue && setCategoryFilter(newValue)}
            size="small"
            sx={{ mt: 1 }}
          >
            <ToggleButton value="ALL">All</ToggleButton>
            <ToggleButton value="ETF">ETF</ToggleButton>
            <ToggleButton value="SATELLITES">Satellites</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing(2), py: 1 }}>
        <ChartCard title="Sector Allocation" data={baseChartData} />
        <ChartCard title="Holding Weight (Invested)" data={investedChartData} />
      </Box>
    </Box>
  );
}
