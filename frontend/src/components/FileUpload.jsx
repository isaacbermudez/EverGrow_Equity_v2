import React, { useState } from 'react';
import { Button, Box, Alert, Paper, Typography, CircularProgress } from '@mui/material';

export default function FileUpload({ onUpload, disabled = false }) { // Accept disabled prop
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    if (!file.name.endsWith('.json')) {
      setError("Please upload a JSON file.");
      setIsLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("Not an array");

      await onUpload(arr);
      setError(null);
    } catch (e) {
      console.error("File processing or upload error:", e);
      setError("Error processing or uploading file. Please check format or try again.");
      onUpload([]); // Call onUpload with empty array on error, important for App.jsx state management
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (f) {
      await processFile(f);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  // Conditionally render the entire component based on the 'disabled' prop
  if (disabled) {
    return null; // Return null if the component should be hidden
  }

  return (
    <Box mb={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
      <Paper
        elevation={isDragOver ? 4 : 1}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: isDragOver ? '#f3f8ff' : '#fafafa',
          textAlign: 'center',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#999'
          }
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
            <CircularProgress />
            <Typography variant="body1" color="textSecondary" ml={2}>
              Processing Assets...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" color="textSecondary" mb={2}>
              Drag and drop your JSON file here, or click to browse
            </Typography>

            <Button
              variant="contained"
              component="label"
              disabled={isLoading}
              sx={{ mb: 1 }}
            >
              Upload Portfolio JSON
              <input
                hidden
                type="file"
                accept=".json"
                onChange={handleFile}
                disabled={isLoading}
              />
            </Button>
          </>
        )}
      </Paper>

      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
    </Box>
  );
}