import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Switch, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useFeatureAccess } from '../../context/FeatureAccessContext';
import { featureCategories } from '../../data/featureCatalog';
import { users } from '../../data/mockData';
import UserAvatar from '../shared/UserAvatar';

const FeatureRolloutPage = () => {
  const { featureCatalog, getUserFeatureConfig, resetUserFeatures, setUserFeature } = useFeatureAccess();
  const [selectedUserId, setSelectedUserId] = useState(users[0].id);
  const selectedUser = users.find((user) => user.id === selectedUserId) || users[0];
  const featureConfig = getUserFeatureConfig(selectedUser);
  const enabledCount = Object.values(featureConfig).filter(Boolean).length;

  const featuresByCategory = useMemo(() => (
    featureCategories
      .map((category) => ({
        category,
        features: featureCatalog.filter((feature) => feature.category === category),
      }))
      .filter((group) => group.features.length)
  ), [featureCatalog]);

  return (
    <Stack gap={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.8fr 1.2fr' }, gap: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Stack direction="row" gap={1.25} alignItems="center">
            <UserAvatar user={selectedUser} size="lg" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3">{selectedUser.name}</Typography>
              <Typography variant="body2">{selectedUser.role} | {selectedUser.department}</Typography>
            </Box>
          </Stack>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>User</InputLabel>
            <Select label="User" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
            <Chip label={`${enabledCount} enabled`} color="success" />
            <Chip label={`${featureCatalog.length - enabledCount} off`} variant="outlined" />
            <Chip label={selectedUser.workingGroup} color="primary" variant="outlined" />
          </Stack>
          <Button
            startIcon={<RestartAltOutlinedIcon />}
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => resetUserFeatures(selectedUser.id)}
          >
            Reset to Role Defaults
          </Button>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <ShieldOutlinedIcon color="primary" />
            <Box>
              <Typography variant="h3">Rollout Controls</Typography>
              <Typography variant="body2">Use these switches to slow-walk functionality by person while Compass is being adopted.</Typography>
            </Box>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.25, mt: 1.5 }}>
            {featuresByCategory.map((group) => (
              <Box key={group.category} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                <Typography variant="h4" color="primary">{group.category}</Typography>
                <Stack gap={0.75} sx={{ mt: 1 }}>
                  {group.features.map((feature) => {
                    const enabled = featureConfig[feature.key];
                    return (
                      <Box key={feature.key} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={800}>{feature.label}</Typography>
                          <Typography variant="caption" display="block">{feature.description}</Typography>
                        </Box>
                        <Switch
                          checked={enabled}
                          inputProps={{ 'aria-label': `${enabled ? 'Disable' : 'Enable'} ${feature.label} for ${selectedUser.name}` }}
                          onChange={(event) => setUserFeature(selectedUser.id, feature.key, event.target.checked)}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
};

export default FeatureRolloutPage;
