'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Launch, Schema, Assignment } from '@mui/icons-material';
import { MissingBundle } from '@/app/lib/data';

interface TransactionCardProps {
  transaction: MissingBundle;
  onClick?: () => void;
}

export default function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const handleCardClick = () => {
    if (transaction.explorerUrl) {
      window.open(transaction.explorerUrl, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      // Handle both seconds (ledger timestamps) and milliseconds (Date.now())
      // If timestamp is less than year 2000 in milliseconds, assume it's in seconds
      const timestampMs = timestamp < 946684800000 ? timestamp * 1000 : timestamp;
      return new Date(timestampMs).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const displayName = transaction.name || transaction.id.split(':').pop() || 'Unknown';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: transaction.explorerUrl ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': transaction.explorerUrl ? {
          boxShadow: 4,
          transform: 'translateY(-2px)'
        } : {},
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            {transaction.type === 'SCHEMA' ? (
              <Schema color="primary" fontSize="small" />
            ) : (
              <Assignment color="secondary" fontSize="small" />
            )}
            <Chip
              label={transaction.type}
              size="small"
              color={transaction.type === 'SCHEMA' ? 'primary' : 'secondary'}
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
          </Box>
          {transaction.explorerUrl && (
            <Tooltip title="View on Candyscan">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(transaction.explorerUrl, '_blank', 'noopener,noreferrer');
                }}
                sx={{ p: 0.5 }}
              >
                <Launch fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="h6"
          component="div"
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 1,
            wordBreak: 'break-word'
          }}
        >
          {displayName}
        </Typography>

        {transaction.version && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Version: {transaction.version}
          </Typography>
        )}

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" display="block">
            Network: {transaction.networkDisplayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Transaction #{transaction.seqNo}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {formatDate(transaction.txTime)}
          </Typography>
        </Box>

        <Box mt={1.5}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              color: 'text.secondary',
              wordBreak: 'break-all',
              display: 'block',
              opacity: 0.7
            }}
          >
            {transaction.id}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

