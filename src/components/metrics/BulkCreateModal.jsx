import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import { Button, Dialog, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material';
import { useActionFeedback } from '../../context/ActionFeedbackContext';

const BulkCreateModal = ({ open, onClose }) => {
  const { unavailable } = useActionFeedback();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Create Metrics</DialogTitle>
      <DialogContent>
        <Typography variant="h4">Download Template</Typography>
        <Typography variant="body2" sx={{ my: 1 }}>Download the Excel template, fill in metric details, then upload the completed file.</Typography>
        <Stack gap={2}>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={() => unavailable('metric template generation is not connected yet.')}>Download Excel Template</Button>
          <Divider />
          <Button variant="contained" startIcon={<UploadOutlinedIcon />} onClick={() => unavailable('metric import needs file storage and parsing configuration.')}>Upload Template</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreateModal;
