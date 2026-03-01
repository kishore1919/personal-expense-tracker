'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  Select,
  MenuItem,
  Radio,
  FormControlLabel,
  Menu,
  Typography,
  Collapse
} from '@mui/material';
import { FiChevronDown } from 'react-icons/fi';

type DurationFilter = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';
type TypeFilter = 'all' | 'in' | 'out';

interface FilterBarProps {
  durationFilter: DurationFilter;
  setDurationFilter: (value: DurationFilter) => void;
  customRange: { start: string; end: string };
  setCustomRange: (range: { start: string; end: string }) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (value: TypeFilter) => void;
  paymentModeFilter: string;
  setPaymentModeFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  expenses: any[];
  onClearFilters: () => void;
  isMobile: boolean;
  showFilters: boolean;
}

export function FilterBar({
  durationFilter,
  setDurationFilter,
  customRange,
  setCustomRange,
  typeFilter,
  setTypeFilter,
  paymentModeFilter,
  setPaymentModeFilter,
  categoryFilter,
  setCategoryFilter,
  expenses,
  onClearFilters,
  isMobile,
  showFilters
}: FilterBarProps) {
  const [durAnchorEl, setDurAnchorEl] = useState<null | HTMLElement>(null);
  const [typeAnchorEl, setTypeAnchorEl] = useState<null | HTMLElement>(null);

  const handleDurClick = (e: React.MouseEvent<HTMLButtonElement>) => setDurAnchorEl(e.currentTarget);
  const handleDurClose = () => setDurAnchorEl(null);
  const handleTypeClick = (e: React.MouseEvent<HTMLButtonElement>) => setTypeAnchorEl(e.currentTarget);
  const handleTypeClose = () => setTypeAnchorEl(null);

  const durationLabels: Record<string, string> = {
    all: 'All Time',
    today: 'Today',
    yesterday: 'Yesterday',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    custom: customRange.start && customRange.end
      ? `${new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
      : 'Custom Range'
  };

  return (
    <Collapse in={showFilters || !isMobile}>
      <Box sx={{
        display: 'flex',
        gap: 1.5,
        mb: 3,
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        {/* Duration Button & Menu */}
        <Button
          variant="outlined"
          onClick={handleDurClick}
          endIcon={<FiChevronDown />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            borderColor: 'divider',
            color: 'text.primary',
            minWidth: 160,
            justifyContent: 'space-between',
            bgcolor: 'background.default'
          }}
        >
          Duration: {durationLabels[durationFilter]}
        </Button>
        <Menu
          anchorEl={durAnchorEl}
          open={Boolean(durAnchorEl)}
          onClose={handleDurClose}
          PaperProps={{ sx: { width: 220, borderRadius: 2, mt: 1 } }}
        >
          {[
            { label: 'All Time', value: 'all' },
            { label: 'Today', value: 'today' },
            { label: 'Yesterday', value: 'yesterday' },
            { label: 'This Month', value: 'thisMonth' },
            { label: 'Last Month', value: 'lastMonth' },
          ].map((opt) => (
              <MenuItem
              key={opt.value}
              onClick={() => {
                setDurationFilter(opt.value as DurationFilter);
                handleDurClose();
              }}
              sx={{ py: 0.5 }}
            >
              <FormControlLabel
                control={<Radio size="small" checked={durationFilter === opt.value} />}
                label={opt.label}
                sx={{ width: '100%', m: 0 }}
              />
            </MenuItem>
          ))}
          <MenuItem onClick={() => { setDurationFilter('custom'); setCustomRange({ start: '', end: '' }); }} sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={<Radio size="small" checked={durationFilter === 'custom'} />}
              label="Custom"
              sx={{ width: '100%', m: 0 }}
            />
          </MenuItem>

          {durationFilter === 'custom' && (
            <Box
              sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">From</Typography>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">To</Typography>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </Box>
            </Box>
          )}
        </Menu>

        {/* Type Button & Menu */}
        <Button
          variant="outlined"
          onClick={handleTypeClick}
          endIcon={<FiChevronDown />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            borderColor: 'divider',
            color: 'text.primary',
            minWidth: 140,
            justifyContent: 'space-between',
            bgcolor: 'background.default'
          }}
        >
          Types: {typeFilter === 'all' ? 'All' : typeFilter === 'in' ? 'Income' : 'Expense'}
        </Button>
        <Menu
          anchorEl={typeAnchorEl}
          open={Boolean(typeAnchorEl)}
          onClose={handleTypeClose}
          PaperProps={{ sx: { width: 180, borderRadius: 2, mt: 1 } }}
        >
          {[
            { label: 'All', value: 'all' },
            { label: 'Income', value: 'in' },
            { label: 'Expense', value: 'out' },
          ].map((opt) => (
            <MenuItem
              key={opt.value}
              onClick={() => {
                setTypeFilter(opt.value as TypeFilter);
                handleTypeClose();
              }}
              sx={{ py: 0.5 }}
            >
              <FormControlLabel
                control={<Radio size="small" checked={typeFilter === opt.value} />}
                label={opt.label}
                sx={{ width: '100%', m: 0 }}
              />
            </MenuItem>
          ))}
        </Menu>

        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <Select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            sx={{ bgcolor: 'background.default', borderRadius: 2 }}
          >
            <MenuItem value={'all'}>Payment Modes: All</MenuItem>
            {Array.from(new Set(expenses.map(e => e.paymentMode || 'Online'))).map(pm => (
              <MenuItem key={pm} value={pm}>{pm}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ bgcolor: 'background.default', borderRadius: 2 }}
          >
            <MenuItem value={'all'}>Categories: All</MenuItem>
            {Array.from(new Set(expenses.map(e => e.category || 'General'))).map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          fullWidth={isMobile}
          onClick={onClearFilters}
          sx={{ textTransform: 'none' }}
        >
          Clear Filters
        </Button>
      </Box>
    </Collapse>
  );
}
