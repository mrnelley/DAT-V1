import { Box, Stack, Typography } from '@mui/material';
import { users } from '../../data/mockData';
import UserAvatar from '../shared/UserAvatar';

const MembersPanel = ({ memberIds = [] }) => {
  const members = users.filter((user) => memberIds.includes(user.id));

  return (
    <Box sx={{ position: { md: 'sticky' }, top: 88, maxHeight: { md: 'calc(100vh - 120px)' }, overflow: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Members</Typography>
      <Stack gap={1}>
        {members.map((user) => (
          <Stack key={user.id} direction="row" gap={1} alignItems="center" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1 }}>
            <UserAvatar user={user} />
            <Box>
              <Typography variant="body1" fontWeight={700}>{user.name}</Typography>
              <Typography variant="body2">{user.department}</Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default MembersPanel;
