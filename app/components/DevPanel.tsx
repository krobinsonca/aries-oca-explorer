'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Science,
  Edit,
} from '@mui/icons-material';
import { useBundleUrl, BUNDLE_LIST_URL_PROD, BUNDLE_LIST_URL_TEST } from '@/app/contexts/BundleUrl';

interface DevPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function DevPanel({ open, onClose }: DevPanelProps) {
  const { env, customUrl, setEnv, setCustomUrl } = useBundleUrl();
  const [localEnv, setLocalEnv] = useState<typeof env>(env);
  const [localCustomUrl, setLocalCustomUrl] = useState(customUrl);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const getTargetUrl = () => {
    if (localEnv === 'production') return BUNDLE_LIST_URL_PROD;
    if (localEnv === 'test') return BUNDLE_LIST_URL_TEST;
    return localCustomUrl;
  };

  const validateUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url}/ocabundleslist.json`, {
        method: 'HEAD',
        mode: 'cors'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleApply = async () => {
    const targetUrl = getTargetUrl();

    if (localEnv === 'custom') {
      if (!localCustomUrl.trim()) {
        setError('Please enter a custom URL');
        return;
      }
      try {
        new URL(localCustomUrl);
      } catch {
        setError('Please enter a valid URL');
        return;
      }
    }

    setError(null);
    setIsValidating(true);

    // Validate URL before applying
    const isValid = await validateUrl(targetUrl);
    setIsValidating(false);

    if (!isValid) {
      if (localEnv === 'test') {
        setError(`Test URL is not available: ${targetUrl}. This environment may not be configured yet.`);
      } else if (localEnv === 'custom') {
        setError(`Custom URL could not be reached. Please check the URL and try again.`);
      } else {
        setError(`URL could not be reached: ${targetUrl}`);
      }
      return;
    }

    setEnv(localEnv);
    setCustomUrl(localCustomUrl);
    onClose();
    // Force page reload to fetch new bundle data
    window.location.reload();
  };

  const handleClose = () => {
    setError(null);
    setLocalEnv(env);
    setLocalCustomUrl(customUrl);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Science fontSize="small" />
          Developer Settings
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="Close">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the OCA Bundles data source. Use Test or Custom URL to verify 
            bundle changes before they are promoted to production.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Environment
            </FormLabel>
            <RadioGroup
              value={localEnv}
              onChange={(e) => {
                setLocalEnv(e.target.value as typeof env);
                setError(null);
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Radio value="production" size="small" />
                  <Typography variant="body2" fontWeight={500}>Production</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  {BUNDLE_LIST_URL_PROD}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Radio value="test" size="small" />
                  <Typography variant="body2" fontWeight={500}>Test</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  {BUNDLE_LIST_URL_TEST}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Radio value="custom" size="small" />
                  <Typography variant="body2" fontWeight={500}>Custom URL</Typography>
                </Box>
              </Box>
            </RadioGroup>
          </FormControl>

          {localEnv === 'custom' && (
            <TextField
              fullWidth
              label="Custom Bundle URL"
              placeholder="https://your-custom-url.com/bundles"
              value={localCustomUrl}
              onChange={(e) => {
                setLocalCustomUrl(e.target.value);
                setError(null);
              }}
              helperText="Enter the full URL to the ocabundleslist.json file"
              size="small"
              InputProps={{
                startAdornment: <Edit fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Changing the environment will refresh the page with new data.
              This setting persists for this browser session only.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isValidating}>
          Cancel
        </Button>
        <Button 
          onClick={handleApply} 
          variant="contained"
          disabled={isValidating}
          startIcon={isValidating ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isValidating ? 'Validating...' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
