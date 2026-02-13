'use client';

import { Box, Button, Typography } from '@mui/material';

interface SelectionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
}

export function SelectionToolbar({
  selectedCount,
  onDelete,
  onCancel,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: { xs: 80, md: 24 },
      left: '50%', 
      transform: 'translateX(-50%)', 
      bgcolor: 'background.paper', 
      p: { xs: 1.5, sm: 2 }, 
      borderRadius: 2, 
      boxShadow: 6, 
      display: 'flex', 
      gap: { xs: 1, sm: 2 }, 
      alignItems: 'center', 
      zIndex: 10,
      width: { xs: '90%', sm: 'auto' },
      justifyContent: 'center',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
        {selectedCount} selected
      </Typography>
      <Button 
        variant="contained" 
        color="error" 
        size="small" 
        onClick={onDelete}
      >
        Delete ({selectedCount})
      </Button>
      <Button variant="outlined" size="small" onClick={onCancel}>
        Cancel
      </Button>
    </Box>
  );
}
