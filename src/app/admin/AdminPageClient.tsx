'use client';

import React from 'react';
import Link from 'next/link';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Container,
} from '@mui/material';

export default function AdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Card sx={{ mb: { xs: 3, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5,
            }}
          >
            Manage categories for your expenses.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: { xs: 2, sm: 3 }, 
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            }}
          >
            Expense Categories
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              lineHeight: 1.6,
            }}
          >
            Category management has moved to{' '}
            <Link 
              href="/settings" 
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Settings
              </Box>
            </Link>. You can add and delete categories from there.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
