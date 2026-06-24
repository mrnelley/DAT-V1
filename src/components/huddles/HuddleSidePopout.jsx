import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOperatingData } from '../../context/OperatingDataContext';

const HuddleSidePopout = ({ onClose, onInteract, open, navOpen }) => {
  const navigate = useNavigate();
  const { huddles } = useOperatingData();
  if (!open) return null;

  const renderGroup = (title, items) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h4" sx={{ px: 2, py: 1 }}>{title}</Typography>
      <List dense>
        {items.map((huddle) => (
          <ListItemButton
            key={huddle.id}
            onClick={() => {
              navigate(`/huddles/${huddle.id}`);
              onClose();
            }}
            sx={{ '&:hover': { bgcolor: 'rgba(94,184,168,0.1)' } }}
          >
            <ListItemText primary={huddle.name} secondary={huddle.recurrence} />
            <ChevronRightIcon fontSize="small" />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component={motion.aside}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
      onFocus={onInteract}
      onKeyDown={onInteract}
      onMouseMove={onInteract}
      onPointerDown={onInteract}
      onTouchStart={onInteract}
      sx={{
        position: 'fixed',
        top: 64,
        bottom: 0,
        left: navOpen ? 240 : 64,
        zIndex: 1100,
        width: 260,
        bgcolor: 'background.paper',
        boxShadow: 3,
        p: 1,
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Button fullWidth startIcon={<AddOutlinedIcon />} onClick={() => { navigate('/huddles/new'); onClose(); }} sx={{ mb: 1 }}>
        Schedule Huddle
      </Button>
      {renderGroup('Today', huddles.filter((huddle) => huddle.when === 'today'))}
      {renderGroup('Future', huddles.filter((huddle) => huddle.when !== 'today'))}
    </Box>
  );
};

export default HuddleSidePopout;
