'use client';

import { Paper, Box, Typography, Checkbox, Skeleton, IconButton, Tooltip, useTheme } from '@mui/material';
import { FiArrowRight } from 'react-icons/fi';
import { FaBook, FaArchive, FaBoxOpen } from 'react-icons/fa';
import type { Book } from '@/app/types';

interface BooksListProps {
  books: Book[];
  loading: boolean;
  selectedIds: string[];
  onSelectBook: (bookId: string, checked: boolean) => void;
  onBookClick: (bookId: string) => void;
  formatCurrency: (amount: number) => string;
  onToggleArchive?: (bookId: string, archived: boolean) => void;
}

function ListSkeleton() {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        mb: 2, 
        border: '1px solid', 
        borderColor: 'divider', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2 
      }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="20%" height={16} />
      </Box>
      <Skeleton variant="text" width="10%" height={24} />
      <Skeleton variant="rectangular" width={100} height={30} />
    </Paper>
  );
}

function BookListItem({
  book,
  isSelected,
  onSelect,
  onClick,
  formatCurrency,
  onToggleArchive,
}: {
  book: Book;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  onToggleArchive?: (bookId: string, archived: boolean) => void;
}) {
  const theme = useTheme(); // Hook to access theme mode
  const isDarkMode = theme.palette.mode === 'dark';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(e.target.checked);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleArchive) {
      onToggleArchive(book.id, !book.archived);
    }
  };

  const isArchived = book.archived ?? false;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'action.hover',
          boxShadow: 1
        }
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
        />
      </Box>
      
      <Box sx={{ 
        width: { xs: 36, sm: 48 }, 
        height: { xs: 36, sm: 48 }, 
        borderRadius: '50%', 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <FaBook size={18} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="subtitle2" 
          fontWeight={600} 
          color="text.primary" 
          noWrap 
          sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          {book.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {book.updatedAtString}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', mr: { xs: 0, sm: 1 } }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color={(book.netBalance ?? 0) >= 0 ? 'success.main' : 'error.main'}
          sx={{ fontSize: { xs: '0.85rem', sm: '1.1rem' } }}
        >
          {formatCurrency(Math.abs(book.netBalance ?? 0))}
        </Typography>
        {isArchived && (
          <Typography variant="caption" color="warning.main" display="block">
            Archived
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={handleActionClick}>
        {onToggleArchive && (
          <Tooltip title={isArchived ? 'Unarchive' : 'Archive'}>
            <IconButton
              size="small"
              onClick={handleArchiveClick}
              sx={{
                // Explicit background adjustment for dark mode visibility
                bgcolor: isArchived 
                  ? (isDarkMode ? 'rgba(255, 167, 38, 0.2)' : 'warning.light') 
                  : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'grey.100'),
                color: isDarkMode ? '#FFD700' : 'inherit', // Force yellow in dark mode
                '&:hover': {
                  bgcolor: isArchived ? 'warning.main' : 'grey.200',
                  color: isArchived && isDarkMode ? '#000' : 'inherit'
                },
              }}
            >
              {isArchived ? <FaBoxOpen size={14} /> : <FaArchive size={14} />}
            </IconButton>
          </Tooltip>
        )}
        <IconButton
          onClick={onClick}
          size="small"
          color="primary"
        >
          <FiArrowRight size={18} />
        </IconButton>
      </Box>
    </Paper>
  );
}

export function BooksList({
  books,
  loading,
  selectedIds,
  onSelectBook,
  onBookClick,
  formatCurrency,
  onToggleArchive,
}: BooksListProps) {
  if (loading) {
    return (
      <Box sx={{ minHeight: 300 }}>
        {[1, 2, 3].map((i) => <ListSkeleton key={i} />)}
      </Box>
    );
  }

  if (books.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="h6">No books found</Typography>
        <Typography variant="body2">Try searching for something else</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 300 }}>
      {books.map((book) => (
        <BookListItem
          key={book.id}
          book={book}
          isSelected={selectedIds.includes(book.id)}
          onSelect={(checked) => onSelectBook(book.id, checked)}
          onClick={() => onBookClick(book.id)}
          formatCurrency={formatCurrency}
          onToggleArchive={onToggleArchive}
        />
      ))}
    </Box>
  );
}