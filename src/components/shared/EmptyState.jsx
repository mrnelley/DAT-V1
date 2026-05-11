import { Box, Button, Typography } from '@mui/material';

const EmptyState = ({ icon, title, body, actionLabel, onAction }) => (
  <Box sx={{ py: 8, px: 2, textAlign: 'center', color: 'text.secondary' }}>
    <Box sx={{ display: 'grid', placeItems: 'center', mb: 1, '& svg': { fontSize: 56 } }}>{icon}</Box>
    <Typography variant="h4" color="text.primary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ mb: actionLabel ? 2 : 0 }}>
      {body}
    </Typography>
    {actionLabel && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
