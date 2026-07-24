import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useOperatingData } from '../../context/OperatingDataContext';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from '../layout/PageWrapper';
import UserAvatar from '../shared/UserAvatar';

const ProfilePage = () => {
  const { users } = useOperatingData();
  const { reloadUserProfile, updateUserProfile, user } = useAuth();
  const [form, setForm] = useState(user);

  useEffect(() => {
    setForm(user);
  }, [user]);

  const firstName = useMemo(() => form.name?.split(' ')[0] || form.name || 'User', [form.name]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = () => {
    const fullName = form.name.trim();
    if (!fullName) return;

    updateUserProfile({
      name: fullName,
      initials: form.initials.trim().toUpperCase(),
      teams: form.teamsText
        ? form.teamsText.split(',').map((team) => team.trim()).filter(Boolean)
        : form.teams,
    });
  };

  const handleReset = () => {
    reloadUserProfile();
  };

  const editableForm = {
    ...form,
    teamsText: Array.isArray(form.teams) ? form.teams.join(', ') : form.teamsText || '',
  };

  return (
    <PageWrapper>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <UserAvatar user={user} size="lg" />
          <Box>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <AccountCircleOutlinedIcon color="primary" />
              <Typography variant="h1">{user.name}</Typography>
            </Stack>
            <Typography variant="body2">{user.role} - {user.department}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip label={user.organization} color="primary" variant="outlined" />
          <Chip label={`Hello, ${firstName}`} color="secondary" variant="outlined" />
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 0.8fr' }, gap: 2 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Profile Details</Typography>
          <Stack gap={2}>
            <TextField label="Full Name" value={editableForm.name || ''} onChange={update('name')} fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField label="Initials" value={editableForm.initials || ''} onChange={update('initials')} fullWidth />
              <TextField label="Organization" value={editableForm.organization || ''} fullWidth disabled />
            </Stack>
            <TextField label="Role Title" value={editableForm.role || ''} fullWidth disabled />
            <TextField label="Department" value={editableForm.department || ''} fullWidth disabled />
            <TextField label="Working Group" value={editableForm.workingGroup || 'Team Member'} fullWidth disabled />
            <TextField label="Dashboard Focus" value={(editableForm.dashboardFocus || 'operations').replaceAll('_', ' ')} fullWidth disabled />
            <TextField
              label="Teams"
              helperText="Comma-separated team names used for dashboard filters and operational routing."
              value={editableForm.teamsText}
              onChange={update('teamsText')}
              fullWidth
              multiline
              minRows={2}
            />
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>Save Profile</Button>
              <Button variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={handleReset}>Reload Profile</Button>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, alignSelf: 'start' }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Directory Context</Typography>
          <Stack gap={1}>
            {users
              .filter((candidate) => candidate.department === user.department)
              .map((candidate) => (
                <Stack key={candidate.id} direction="row" alignItems="center" gap={1}>
                  <UserAvatar user={candidate} size="sm" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={700}>{candidate.name}</Typography>
                    <Typography variant="caption">{candidate.role}</Typography>
                  </Box>
                </Stack>
              ))}
          </Stack>
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default ProfilePage;
