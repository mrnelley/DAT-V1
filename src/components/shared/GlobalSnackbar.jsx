import { Alert, Snackbar } from '@mui/material';
import { motion } from 'framer-motion';

const GlobalSnackbar = ({ open, message, severity = 'info', onClose }) => (
  <Snackbar open={open} autoHideDuration={4000} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </motion.div>
  </Snackbar>
);

export default GlobalSnackbar;
