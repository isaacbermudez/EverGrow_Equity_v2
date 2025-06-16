// src/components/PortfolioCharts.jsx
import React from 'react';
import { Box, Typography, Paper, useTheme, Grid, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Zap } from 'lucide-react';
import { teal } from '@mui/material/colors'; // Import teal color for consistency

// Helper: if not a number, fall back to 0
const safeNum = (n) => (typeof n === 'number' ? n : 0);

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6384',
    '#36A2EB', '#FFCE56', '#8A2BE2', '#00CED1', '#FF4500', '#DA70D6',
    '#E0BBE4', '#957DAD', '#D291BC', '#FFC72C', '#FF6B6B', '#7A73F0'
];

// Adjusted to show ONLY percentage labels on the chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    const percentage = (percent * 100).toFixed(0);

    // Only display label if percentage is greater than a threshold (e.g., 3%) to avoid clutter
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
                {`${percentage}%`}
            </text>
        );
    }
    return null; // Hide label for very small slices
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
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
                    {data.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#00C49F' }}>
                    Value: ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFBB28' }}>
                    Percentage: {((data.value / data.total) * 100).toFixed(1)}%
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

    // Calculate total invested amount (Cost Basis)
    const totalInvestedAmount = rows.reduce((acc, stock) => {
        return acc + safeNum(stock.CI);
    }, 0);

    // Calculate total profit/loss (Market Value - Invested Amount)
    const totalProfitLoss = totalValue - totalInvestedAmount;

    // Calculate profit/loss percentage
    const profitLossPercentage = totalInvestedAmount > 0 ? ((totalProfitLoss / totalInvestedAmount) * 100) : 0;

    // Count unique categories for summary stat
    const uniqueCategories = new Set();
    rows.forEach(stock => {
        if (stock.category) {
            uniqueCategories.add(stock.category);
        }
    });

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
        .sort((a, b) => b.value - a.value);

    // Data aggregation for Holding Weight per Invested Amount Chart
    const investedAmountChartData = rows
        .map(stock => ({
            name: stock.symbol || 'N/A',
            value: safeNum(stock.CI),
            total: totalInvestedAmount
        }))
        .filter(entry => entry.value > 0)
        .sort((a, b) => b.value - a.value);

    // Check if there's any valid data with non-zero values for charts
    const hasValidSectorData = sectorChartData.some(entry => entry.value > 0);
    const hasValidInvestedAmountData = investedAmountChartData.some(entry => entry.value > 0);

    const ChartCard = ({ title, data, hasData, dataKey = "value" }) => (
        <Card
            elevation={6}
            sx={{
                height: 480,
                flex: '1 1 300px',
                minWidth: { xs: '100%', sm: '400px', md: '450px' },
                maxWidth: 'calc(50% - ' + theme.spacing(1.5) + ')',
                m: 1.5,
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
                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 100 }}>
                                    <Pie
                                        data={data}
                                        cx="15%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={100}
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
                                        verticalAlign="middle"
                                        align="left"
                                        wrapperStyle={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 'auto',
                                            fontSize: '0.85rem',
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            fontWeight: '500',
                                            paddingRight: theme.spacing(1),
                                            maxHeight: '100%',
                                            overflowY: 'auto'
                                        }}
                                        formatter={(value, entry) => (
                                            <span style={{
                                                color: 'rgba(255,255,255,0.9)',
                                                fontWeight: '500',
                                                overflowWrap: 'break-word',
                                                wordBreak: 'break-word',
                                                whiteSpace: 'normal',
                                                lineHeight: '1.2'
                                            }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
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

            {/* Summary Stats - Fixed Grid Layout */}
            <Box sx={{ width: '100%', mb: 3 }}>
                <Grid container spacing={2}>
                    {/* Total Market Value */}
                    <Grid item xs={12} sm={6} md={4}>
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
                                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Market Value
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Total Invested Amount */}
                    <Grid item xs={12} sm={6} md={4}>
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
                                ${totalInvestedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Invested Amount
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Total Profit/Loss - Fixed positioning */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2.5,
                                textAlign: 'center',
                                background: totalProfitLoss >= 0
                                    ? 'linear-gradient(135deg, rgba(0,196,159,0.15) 0%, rgba(0,196,159,0.08) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,99,132,0.15) 0%, rgba(255,99,132,0.08) 100%)',
                                border: totalProfitLoss >= 0
                                    ? '1px solid rgba(0,196,159,0.3)'
                                    : '1px solid rgba(255,99,132,0.3)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: totalProfitLoss >= 0
                                        ? '0 8px 25px rgba(0,196,159,0.2)'
                                        : '0 8px 25px rgba(255,99,132,0.2)'
                                }
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    color: totalProfitLoss >= 0 ? '#00C49F' : '#FF6384',
                                    fontWeight: 700,
                                    mb: 0.5
                                }}
                            >
                                {totalProfitLoss >= 0 ? '+' : ''}
                                ${totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: totalProfitLoss >= 0 ? '#00C49F' : '#FF6384',
                                    fontWeight: 600,
                                    mb: 0.5
                                }}
                            >
                                ({profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(1)}%)
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Profit/Loss
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Number of Sectors */}
                    <Grid item xs={12} sm={4} md={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2.5,
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(255,99,132,0.15) 0%, rgba(255,99,132,0.08) 100%)',
                                border: '1px solid rgba(255,99,132,0.3)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(255,99,132,0.2)'
                                }
                            }}
                        >
                            <Typography variant="h4" sx={{ color: '#FF6384', fontWeight: 700, mb: 1 }}>
                                {sectorChartData.length}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Sectors
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Number of Holdings */}
                    <Grid item xs={12} sm={4} md={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2.5,
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(162,141,255,0.15) 0%, rgba(162,141,255,0.08) 100%)',
                                border: '1px solid rgba(162,141,255,0.3)',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(162,141,255,0.2)'
                                }
                            }}
                        >
                            <Typography variant="h4" sx={{ color: '#A28DFF', fontWeight: 700, mb: 1 }}>
                                {rows.length}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Holdings
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Number of Categories */}
                    <Grid item xs={12} sm={4} md={4}>
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
                                {uniqueCategories.size}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                Categories
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Charts Section */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: theme.spacing(3),
                    py: 2
                }}
            >
                <ChartCard
                    title="Sector Allocation"
                    data={sectorChartData}
                    hasData={hasValidSectorData}
                />
                <ChartCard
                    title="Holding Weight (Invested)"
                    data={investedAmountChartData}
                    hasData={hasValidInvestedAmountData}
                />
            </Box>
        </Box>
    );
}