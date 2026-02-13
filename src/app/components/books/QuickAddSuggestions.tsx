'use client';

import { Box, Typography, Paper, Chip } from '@mui/material';
import { FiPlus } from 'react-icons/fi';

interface QuickAddSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function QuickAddSuggestions({
  suggestions,
  onSelect,
}: QuickAddSuggestionsProps) {
  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 2, sm: 3 }, 
      mt: 4, 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : undefined
    }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'success.light', 
          color: 'success.main',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FiPlus size={20} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Quick Add</Typography>
          <Typography variant="caption" color="text.secondary">
            Select a suggestion to quickly create a book
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestions.map((suggestion) => (
          <Chip 
            key={suggestion} 
            label={suggestion} 
            onClick={() => onSelect(suggestion)}
            size="small"
            sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.08)', 
              color: 'primary.main', 
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.15)' 
              }
            }} 
          />
        ))}
      </Box>
    </Paper>
  );
}
