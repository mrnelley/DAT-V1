import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import { Button, Dialog, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material';

const BulkCreateModal = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Bulk Create Metrics</DialogTitle>
    <DialogContent>
      <Typography variant="h4">Download Template</Typography>
      <Typography variant="body2" sx={{ my: 1 }}>Download the Excel template, fill in metric details, then upload the completed file.</Typography>
      <Stack gap={2}>
        <Button variant="outlined" startIcon={<DownloadOutlinedIcon />}>Download Excel Template</Button>
        <Divider />
        <Button variant="contained" startIcon={<UploadOutlinedIcon />}>Upload Template</Button>
      </Stack>
    </DialogContent>
  </Dialog>
);

export default BulkCreateModal;
