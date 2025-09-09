'use client';

import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Backdrop,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { Clear, ExpandMore, Launch } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { 
  groupBundlesByLedger,
  getAvailableLedgerOptions,
  filterBundles,
  BundleWithLedger
} from '@/app/lib/data';
import SimpleCredentialCard from './SimpleCredentialCard';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/app/contexts/Language';
import { BrandingProvider } from '@/app/contexts/Branding';

interface EnhancedCredentialFilterProps {
  options: BundleWithLedger[];
}

export default function EnhancedCredentialFilter({ options }: EnhancedCredentialFilterProps) {
  const [selectedLedger, setSelectedLedger] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();

  // Check if bundles have ledger information loaded
  const hasLedgerInfo = options.length > 0 && options[0].ledger !== undefined;

  // Create ledger options for the dropdown
  const ledgerOptions = useMemo(() => {
    const ledgerOptionsData = getAvailableLedgerOptions(options);
    return ledgerOptionsData.map(option => ({
      value: option.value,
      label: `${option.label} (${option.count})`
    }));
  }, [options]);

  // Filter bundles based on current filters
  const filteredBundles = useMemo(() => {
    const filtered = filterBundles(options, {
      ledger: selectedLedger,
      searchTerm: searchTerm
    });
    return filtered;
  }, [options, selectedLedger, searchTerm]);

  // Group filtered bundles by ledger for display
  const filteredGroupedBundles = useMemo(() => {
    return groupBundlesByLedger(filteredBundles);
  }, [filteredBundles]);

  const handleBundleSelect = async (bundle: BundleWithLedger) => {
    setIsLoading(true);
    try {
      // Add a small delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/identifier/${encodeURIComponent(bundle.id)}`);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedLedger('');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedLedger || searchTerm;

  // Show loading state if ledger info is still being fetched
  if (!hasLedgerInfo) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading credential bundles with ledger information...
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading credential details...
          </Typography>
        </Box>
      </Backdrop>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          OCA Bundle Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Explore and filter through available credential bundles. Search by name or description, 
          or filter by ledger network.
        </Typography>

        {/* Filter Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search bundles"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="ledger-select-label">Filter by Ledger</InputLabel>
              <Select
                labelId="ledger-select-label"
                value={selectedLedger}
                label="Filter by Ledger"
                onChange={(e) => setSelectedLedger(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Ledgers</em>
                </MenuItem>
                {ledgerOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <LanguageSwitcher />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              startIcon={<Clear />}
              sx={{ height: '56px' }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {hasActiveFilters && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Active filters:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  onDelete={() => setSearchTerm('')}
                  deleteIcon={<Clear />}
                  variant="outlined"
                />
              )}
              {selectedLedger && (
                <Chip
                  label={`Ledger: ${ledgerOptions.find(opt => opt.value === selectedLedger)?.label || selectedLedger}`}
                  onDelete={() => setSelectedLedger('')}
                  deleteIcon={<Clear />}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Results Summary */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredBundles.length} bundle{filteredBundles.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ` (filtered from ${options.length} total)`}
        </Typography>
      </Paper>

      {/* Results */}
      {filteredBundles.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No bundles found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search criteria or clearing the filters.
          </Typography>
        </Paper>
      ) : (
        Object.entries(filteredGroupedBundles).map(([ledger, bundles]) => (
          <Accordion key={ledger} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls={`${ledger}-content`}
              id={`${ledger}-header`}
            >
              <Typography variant="h6" component="div">
                {bundles[0]?.ledgerDisplayName || ledger || 'Unknown Ledger'} 
                <Chip 
                  label={bundles.length} 
                  size="small" 
                  sx={{ ml: 2 }} 
                  color="primary"
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {bundles.map((bundle) => (
                  <Grid item xs={12} sm={6} md={4} key={bundle.id}>
                    <BrandingProvider>
                      <SimpleCredentialCard
                        bundle={bundle}
                        onClick={() => handleBundleSelect(bundle)}
                        language={language}
                      />
                    </BrandingProvider>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
}