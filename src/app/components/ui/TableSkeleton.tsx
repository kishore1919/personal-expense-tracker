'use client';

import React from 'react';
import { TableRow, TableCell, Skeleton } from '@mui/material';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

/**
 * Reusable table skeleton loader for loading states.
 * Displays placeholder rows that mimic actual table structure.
 *
 * @param columns - Number of columns to display (default: 8)
 * @param rows - Number of skeleton rows to display (default: 5)
 */
export function TableSkeleton({ columns = 8, rows = 5 }: TableSkeletonProps) {
  const skeletonRows = Array.from({ length: rows }, (_, i) => (
    <TableRow key={i}>
      {Array.from({ length: columns }, (_, j) => (
        <TableCell key={j}>
          <Skeleton
            variant="text"
            width={j === columns - 1 ? '60%' : '80%'}
            sx={{ minWidth: j === columns - 1 ? 60 : undefined }}
          />
        </TableCell>
      ))}
    </TableRow>
  ));

  return <>{skeletonRows}</>;
}

/**
 * Table skeleton with action column (for tables with edit/delete buttons).
 * Last column shows a rectangular skeleton to represent action buttons.
 * Ensures at least one data cell is rendered even when columns is 1.
 */
export function TableSkeletonWithActions({
  columns = 8,
  rows = 5,
}: TableSkeletonProps) {
  const dataCellsCount = Math.max(1, columns - 1);
  const skeletonRows = Array.from({ length: rows }, (_, i) => (
    <TableRow key={i}>
      {Array.from({ length: dataCellsCount }, (_, j) => (
        <TableCell key={j}>
          <Skeleton variant="text" width="80%" />
        </TableCell>
      ))}
      <TableCell>
        <Skeleton variant="rectangular" width={80} height={30} />
      </TableCell>
    </TableRow>
  ));

  return <>{skeletonRows}</>;
}

/**
 * Legacy TableRowSkeleton component for backward compatibility.
 * Use TableSkeletonWithActions for new code.
 */
export function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="rectangular" width={80} height={30} /></TableCell>
    </TableRow>
  );
}
