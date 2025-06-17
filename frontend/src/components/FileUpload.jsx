import React, { useState } from 'react';
import { Button, Box, Alert, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { teal } from '@mui/material/colors'; // Import teal for consistent theming

export default function FileUpload({ onUpload, isDataLoaded, isLoading: propIsLoading }) {
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(false); // Internal loading state for file processing

  const isLoading = propIsLoading || internalIsLoading; // Combine external and internal loading

  const processFile = async (file) => {
    if (!file) return;

    setInternalIsLoading(true);
    setError(null);

    if (!file.name.endsWith('.json')) {
      setError("Please upload a JSON file.");
      setInternalIsLoading(false);
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
      setInternalIsLoading(false);
    }
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (f) {
      await processFile(f);
    }
    // Clear the input value so the same file can be selected again
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDataLoaded && !isLoading) { // Allow drag only if data isn't loaded and not currently loading
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

    if (isDataLoaded || isLoading) return; // Prevent drop if data is loaded or loading

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <Box mb={1} sx={{ width: '100%' }}>
      {isDataLoaded ? (
        <Chip
          icon={<CheckCircleIcon sx={{ color: 'white' }} />}
          label="Data Loaded"
          sx={{
            backgroundColor: teal[700],
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            width: '100%',
            justifyContent: 'flex-start',
            cursor: 'default',
            fontSize: '0.85rem',
            py: 0.5,
          }}
        />
      ) : (
        <Paper
          elevation={isDragOver ? 4 : 1}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 1.5, // Reduced padding for compact sidebar
            border: isDragOver ? '2px dashed #00C49F' : '2px dashed rgba(255,255,255,0.5)',
            backgroundColor: isDragOver ? teal[800] : 'transparent', // Match sidebar background
            textAlign: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            color: 'white', // Ensure text color is white
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: teal[800], // Darker hover for better feedback
              borderColor: teal[500],
            },
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} sx={{ color: 'white' }} />
              <Typography variant="caption" sx={{ mt: 1, color: 'white' }}>
                Processing...
              </Typography>
            </Box>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 32, color: 'white' }} />
              <Typography variant="caption" sx={{ color: 'white' }}>
                Drag & Drop or Click to Upload JSON
              </Typography>

              <Button
                variant="contained"
                component="label"
                disabled={isLoading}
                sx={{
                  backgroundColor: teal[600],
                  '&:hover': { backgroundColor: teal[500] },
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '0.75rem', // Smaller font size for sidebar button
                  px: 1.5, // Smaller padding
                  py: 0.5,
                }}
              >
                Upload JSON
                <input
                  hidden
                  id="file-input" // Add an ID to the input for programmatic click
                  type="file"
                  accept=".json"
                  onChange={handleFile}
                  disabled={isLoading}
                />
              </Button>
            </>
          )}
        </Paper>
      )}

      {error && (
        <Box mt={1}>
          <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{error}</Alert>
        </Box>
      )}
    </Box>
  );
}