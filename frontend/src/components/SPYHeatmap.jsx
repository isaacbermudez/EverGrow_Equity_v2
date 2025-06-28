// src/components/SPYHeatmap.jsx

import React, { useState, useEffect } from 'react';

export default function SPYHeatmap() {
    const [heatmapImage, setHeatmapImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('one_day');

    const fetchHeatmap = async (selectedDateRange) => {
        setLoading(true);
        setError(null);
        setHeatmapImage(null);

        try {
            // *** REVERTED TO RELATIVE PATH ***
            const response = await fetch(`/api/spy-heatmap?date_range=${selectedDateRange}`);

            if (!response.ok) {
                // Improved error handling as seen in FredDataDisplay for robustness
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If response is not JSON (e.g., HTML 404 page), get raw text
                    const text = await response.text();
                    console.error("Non-JSON error response:", text);
                    throw new Error(`Server error: ${response.status} ${response.statusText}. Response not JSON.`);
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.image) {
                setHeatmapImage(`data:image/png;base64,${data.image}`);
            } else if (data.message) {
                setError(data.message);
            } else {
                setError("No image data received from the server.");
            }
        } catch (err) {
            console.error("Failed to fetch heatmap:", err);
            setError(`Failed to load heatmap: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeatmap(dateRange);
    }, [dateRange]);

    const handleDateRangeChange = (event) => {
        setDateRange(event.target.value);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f2f5', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                S&P 500 Heatmap
            </h2>

            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="dateRangeSelect" style={{ marginRight: '10px', fontWeight: 'bold', color: '#555' }}>
                    Select Date Range:
                </label>
                <select
                    id="dateRangeSelect"
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
                >
                    <option value="one_day">One Day</option>
                    <option value="after_hours">After Hours</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="one_week">One Week</option>
                    <option value="one_month">One Month</option>
                    <option value="ytd">Year To Date</option>
                    <option value="one_year">One Year</option>
                </select>
            </div>

            {loading && <p style={{ color: '#007bff' }}>Loading heatmap...</p>}
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>}

            {!loading && !error && heatmapImage && (
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={heatmapImage}
                        alt="S&P 500 Heatmap"
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                    />
                </div>
            )}
            {!loading && !error && !heatmapImage && (
                <p style={{ color: '#666' }}>No heatmap image available. Please try a different date range or check the backend server.</p>
            )}
        </div>
    );
}