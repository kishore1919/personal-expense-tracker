'use client';

import { Box, Typography, IconButton, Button, Badge } from '@mui/material';
import { FiChevronLeft, FiArchive, FiBarChart2, FiDownload, FiFilter } from 'react-icons/fi';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface BookHeaderProps {
  bookId: string;
  bookName: string;
  isArchived: boolean;
  isMobile: boolean;
  onToggleArchive: () => void;
  onExport: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

export function BookHeader({
  bookId,
  bookName,
  isArchived,
  isMobile,
  onToggleArchive,
  onExport,
  onToggleFilters,
  showFilters
}: BookHeaderProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box sx={{
      display: 'flex',
      alignItems: { xs: 'flex-start', sm: 'center' },
      justifyContent: 'space-between',
      mb: 2,
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => router.back()}
          size="small"
          sx={{
            ml: -1.5,
            p: 2.5,
            '& .MuiSvgIcon-root, & svg': { fontSize: '1.25rem' }
          }}
        >
          <FiChevronLeft />
        </IconButton>
        <Typography variant="h5" fontWeight={700} noWrap sx={{ maxWidth: { xs: '200px', sm: '100%' } }}>
          {bookName || <span style={{ width: 120, display: 'inline-block', background: 'rgba(0,0,0,0.1)', height: 20, borderRadius: 4 }} />}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
        <Button
          variant="outlined"
          startIcon={<FiArchive color="inherit" />}
          onClick={onToggleArchive}
          color={isArchived ? 'warning' : 'inherit'}
          fullWidth={isMobile}
          sx={{ textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
        >
          {isArchived ? 'Archived' : 'Archive'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<FiBarChart2 />}
          onClick={() => router.push(`/book/${bookId}/analytics`)}
          fullWidth={isMobile}
          sx={{ textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
        >
          Analytics
        </Button>

        <Button
          variant="outlined"
          startIcon={<FiDownload />}
          onClick={onExport}
          fullWidth={isMobile}
          sx={{ textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
        >
          Export
        </Button>

        <Button
          variant="outlined"
          startIcon={<FiFilter />}
          onClick={onToggleFilters}
          color={showFilters ? 'primary' : 'inherit'}
          sx={{ display: { md: 'none' }, minWidth: 'auto' }}
        >
          Filters
        </Button>
      </Box>
    </Box>
  );
}
