'use client';

import React from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';

interface SelectionActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
  deleteLabel?: string;
  cancelLabel?: string;
  sx?: SxProps<Theme>;
}

export default function SelectionActionBar({
  selectedCount,
  onDelete,
  onCancel,
  deleteLabel = 'Delete',
  cancelLabel = 'Cancel',
  sx = {},
}: SelectionActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 80, md: 24 },
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1220' : 'white',
        p: 2,
        borderRadius: 2,
        boxShadow: 3,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        zIndex: 10,
        width: { xs: '90%', sm: 'auto' },
        justifyContent: 'center',
        ...sx,
      }}
    >
      <Typography variant="body2">{selectedCount} selected</Typography>
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={onDelete}
      >
        {deleteLabel} ({selectedCount})
      </Button>
      <Button variant="outlined" size="small" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </Box>
  );
}
