'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  count,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !isDeleting && onClose()}
    >
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {count > 1 
            ? `Are you sure you want to delete ${count} books and all their expenses? This cannot be undone.`
            : 'Are you sure you want to delete this book and all its expenses? This cannot be undone.'
          }
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          autoFocus 
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
