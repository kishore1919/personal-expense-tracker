'use client';

import { Paper, Box, Typography, Checkbox, Skeleton, IconButton } from '@mui/material';
import { FiArrowRight } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import type { Book } from '@/app/types';

interface BooksListProps {
  books: Book[];
  loading: boolean;
  selectedIds: string[];
  onSelectBook: (bookId: string, checked: boolean) => void;
  onBookClick: (bookId: string) => void;
  formatCurrency: (amount: number) => string;
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
}: {
  book: Book;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}) {
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
        '&:hover': (theme) => ({
          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'action.hover',
          boxShadow: 1
        })
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
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(129, 140, 248, 0.1)' : 'primary.light', 
        color: 'primary.main',
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
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={handleActionClick}>
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
        />
      ))}
    </Box>
  );
}
