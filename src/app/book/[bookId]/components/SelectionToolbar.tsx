'use client';

import { Box, Button, Typography } from '@mui/material';

interface SelectionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function SelectionToolbar({
  selectedCount,
  onDelete,
  onCancel,
  isDeleting = false
}: SelectionToolbarProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 80, md: 24 },
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: 6,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        zIndex: 10,
        width: { xs: '90%', sm: 'auto' },
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
        {selectedCount} items selected
      </Typography>
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={onDelete}
        disabled={isDeleting}
      >
        Delete ({selectedCount})
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={onCancel}
        disabled={isDeleting}
      >
        Cancel
      </Button>
    </Box>
  );
}
