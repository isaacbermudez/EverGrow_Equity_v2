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
    if (f) { // Ensure file exists before processing
      await processFile(f);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) { // Only set drag-over state if not disabled
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
    
    if (disabled) return; // If disabled, do nothing on drop

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <Box mb={1} sx={{ width: { xs: '100%', md: 'auto' } }}> {/* Adjusted width for better layout */}
      <Paper
        elevation={isDragOver ? 4 : 1}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: isDragOver && !disabled ? '2px dashed #1976d2' : '2px dashed #ccc', // Color change only if not disabled
          backgroundColor: disabled ? '#333' : (isDragOver ? '#f3f8ff' : '#fafafa'), // Grey out if disabled
          textAlign: 'center',
          cursor: isLoading || disabled ? 'not-allowed' : 'pointer', // Cursor change
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: disabled ? '#333' : '#f5f5f5', // No hover effect if disabled
            borderColor: disabled ? '#ccc' : '#999' // No border change if disabled
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
              {disabled ? "Portfolio data loaded." : "Drag and drop your JSON file here, or click to browse"}
            </Typography>
            
            <Button
              variant="contained"
              component="label"
              disabled={isLoading || disabled} // Disable button based on isLoading or prop
              sx={{ mb: 1 }}
            >
              {disabled ? "Data Loaded" : "Upload Portfolio JSON"}
              <input
                hidden
                type="file"
                accept=".json"
                onChange={handleFile}
                disabled={isLoading || disabled} // Also disable the actual input
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