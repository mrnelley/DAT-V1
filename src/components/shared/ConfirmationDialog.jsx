import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const ConfirmationDialog = ({ open, title, body, onCancel, onConfirm }) => (
  <Dialog aria-describedby="confirmation-dialog-body" aria-labelledby="confirmation-dialog-title" open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <Box component={motion.div} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
      <DialogTitle id="confirmation-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberOutlinedIcon color="error" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography id="confirmation-dialog-body" variant="body2">{body}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Box>
  </Dialog>
);

export default ConfirmationDialog;
