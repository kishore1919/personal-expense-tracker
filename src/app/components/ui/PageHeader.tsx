'use client';

import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: { xs: 2, sm: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h4" 
            fontWeight={600} 
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Button
            variant="contained"
            onClick={action.onClick}
            startIcon={action.icon}
            size="large"
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.25 },
              display: { sm: 'inline-block' },
              width: { sm: 'auto' },
            }}
          >
            {action.label}
          </Button>
        )}
      </Box>
    </Box>
  );
}
