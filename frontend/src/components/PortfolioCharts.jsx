// src/components/PortfolioCharts.jsx
import React from 'react';
import { Box, Typography, Paper, useTheme, Grid, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Zap } from 'lucide-react';

// Helper: if not a number, fall back to 0
const safeNum = (n) => (typeof n === 'number' ? n : 0);

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6384',
    '#36A2EB', '#FFCE56', '#8A2BE2', '#00CED1', '#FF4500', '#DA70D6'
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Only show label if percentage is meaningful (e.g., > 3%)
    if (percent * 100 > 3) {
        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize="11"
                fontWeight="600"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    }
    return null;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <Paper
                elevation={8}
                sx={{
                    p: 1.5,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2
                }}
            >
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {payload[0].name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#00C49F' }}>
                    Value: ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFBB28' }}>
                    Percentage: {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%
                </Typography>
            </Paper>
        );
    }
    return null;
};

export default function PortfolioCharts({ rows = [] }) {
    const theme = useTheme();

    // Calculate total portfolio market value
    const totalValue = rows.reduce((acc, stock) => {
        return acc + (safeNum(stock.currentPrice) * safeNum(stock.holdings));
    }, 0);

    // Calculate total invested amount (Cost Basis) - NEW CALCULATION
    const totalInvestedAmount = rows.reduce((acc, stock) => {
        return acc + safeNum(stock.CI);
    }, 0);

    // Data aggregation for Category Chart
    const categoryData = rows.reduce((acc, stock) => {
        const category = stock.category || 'Uncategorized';
        const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += marketValue;
        return acc;
    }, {});

    const categoryChartData = Object.keys(categoryData)
        .map(name => ({
            name,
            value: categoryData[name],
            total: totalValue
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending

    // Data aggregation for Sector Chart
    const sectorData = rows.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
        if (!acc[sector]) {
            acc[sector] = 0;
        }
        acc[sector] += marketValue;
        return acc;
    }, {});

    const sectorChartData = Object.keys(sectorData)
        .map(name => ({
            name,
            value: sectorData[name],
            total: totalValue
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending

    // Data aggregation for Holding Weight per Invested Amount Chart - NEW CHART DATA
    const investedAmountChartData = rows
        .map(stock => ({
            name: stock.symbol || 'N/A', // Use symbol for each holding
            value: safeNum(stock.CI),    // Use invested amount (CI)
            total: totalInvestedAmount   // Use total invested amount for percentage
        }))
        .filter(entry => entry.value > 0) // Only include holdings with non-zero invested amount
        .sort((a, b) => b.value - a.value); // Sort by value descending

    // Check if there's any valid data with non-zero values for charts
    const hasValidCategoryData = categoryChartData.some(entry => entry.value > 0);
    const hasValidSectorData = sectorChartData.some(entry => entry.value > 0);
    const hasValidInvestedAmountData = investedAmountChartData.some(entry => entry.value > 0); // NEW CHECK

    const ChartCard = ({ title, data, hasData, dataKey = "value" }) => (
        <Card
            elevation={6}
            sx={{
                height: 380,
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
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        color: 'white',
                        textAlign: 'center',
                        fontWeight: 600,
                        mb: 2,
                        fontSize: '1.1rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                >
                    {title}
                </Typography>

                {hasData ? (
                    <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey={dataKey}
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth={1}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    wrapperStyle={{
                                        fontSize: '0.75rem',
                                        paddingLeft: '10px',
                                        maxWidth: '120px',
                                        lineHeight: '1.3'
                                    }}
                                    formatter={(value) => (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'rgba(255,255,255,0.9)',
                                            fontWeight: '500'
                                        }}>
                                            {value.length > 10 ? `${value.substring(0, 10)}...` : value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(0,196,159,0.1) 0%, rgba(0,136,254,0.1) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed rgba(255,255,255,0.2)'
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '2rem',
                                    opacity: 0.6
                                }}
                            >
                                📊
                            </Typography>
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255,255,255,0.7)',
                                textAlign: 'center',
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}
                        >
                            No data available
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Header Section */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 1,
                        background: 'linear-gradient(45deg, #00C49F, #0088FE)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    <Zap
                        size={16}
                        color="#f9a825"
                        style={{ marginRight: 8, animation: 'pulse 1s infinite' }}
                    /> Portfolio Status
                </Typography>
            </Box>

            {/* Summary Stats */}
            <Box sx={{ width: '100%', mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2.5,
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(0,196,159,0.15) 0%, rgba(0,196,159,0.08) 100%)',
                                border: '1px solid rgba(0,196,159,0.3)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0,196,159,0.2)'
                                }
                            }}
                        >
                            <Typography variant="h4" sx={{ color: '#00C49F', fontWeight: 700, mb: 1 }}>
                                {categoryChartData.length}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Categories
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2.5,
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(0,136,254,0.15) 0%, rgba(0,136,254,0.08) 100%)',
                                border: '1px solid rgba(0,136,254,0.3)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0,136,254,0.2)'
                                }
                            }}
                        >
                            <Typography variant="h4" sx={{ color: '#0088FE', fontWeight: 700, mb: 1 }}>
                                {sectorChartData.length}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Sectors
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2.5,
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(255,187,40,0.15) 0%, rgba(255,187,40,0.08) 100%)',
                                border: '1px solid rgba(255,187,40,0.3)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(255,187,40,0.2)'
                                }
                            }}
                        >
                            <Typography variant="h4" sx={{ color: '#FFBB28', fontWeight: 700, mb: 1 }}>
                                {rows.length}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Holdings
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Charts Grid - Now in responsive layout */}
            <Box sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} lg={4}>
                        <ChartCard
                            title="Category Allocation"
                            data={categoryChartData}
                            hasData={hasValidCategoryData}
                        />
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        <ChartCard
                            title="Sector Allocation"
                            data={sectorChartData}
                            hasData={hasValidSectorData}
                        />
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        <ChartCard
                            title="Holding Weight (Invested)"
                            data={investedAmountChartData}
                            hasData={hasValidInvestedAmountData}
                        />  
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}