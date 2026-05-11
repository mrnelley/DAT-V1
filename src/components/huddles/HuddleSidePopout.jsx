import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { huddles } from '../../data/mockData';

const HuddleSidePopout = ({ open, navOpen }) => {
  const navigate = useNavigate();
  if (!open) return null;
  const renderGroup = (title, items) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h4" sx={{ px: 2, py: 1 }}>{title}</Typography>
      <List dense>
        {items.map((huddle) => (
          <ListItemButton key={huddle.id} onClick={() => navigate(`/huddles/${huddle.id}`)} sx={{ '&:hover': { bgcolor: 'rgba(94,184,168,0.1)' } }}>
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
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
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
      {renderGroup('Today', huddles.filter((huddle) => huddle.when === 'today'))}
      {renderGroup('Future', huddles.filter((huddle) => huddle.when === 'future'))}
    </Box>
  );
};

export default HuddleSidePopout;
