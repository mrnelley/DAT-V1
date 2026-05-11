import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { users } from '../../data/mockData';
import { getStatusFromPercent, statusColorMap } from '../../utils/statusColors';
import UserAvatar from '../shared/UserAvatar';

const MembersPanel = () => (
  <Box sx={{ position: { md: 'sticky' }, top: 88, maxHeight: { md: 'calc(100vh - 120px)' }, overflow: 'auto' }}>
    <Typography variant="h4" sx={{ mb: 1 }}>Members</Typography>
    <Stack gap={1}>
      {users.map((user, index) => {
        const progress = [86, 74, 58, 42][index];
        return (
          <Card key={user.id}>
            <CardContent>
              <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
                <UserAvatar user={user} />
                <Typography variant="body1" fontWeight={700}>{user.name}</Typography>
              </Stack>
              <Typography variant="body2">Tagged Priority Progress: <Box component="span" sx={{ color: statusColorMap[getStatusFromPercent(progress)], fontWeight: 700 }}>{progress}%</Box></Typography>
              <Typography variant="body2">Top Tasks Completed: {index === 3 ? 'No Top Tasks' : index + 2}</Typography>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </Box>
);

export default MembersPanel;
