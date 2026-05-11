import { Avatar, Tooltip } from '@mui/material';

const sizes = { sm: 24, md: 32, lg: 40, xl: 56 };

const UserAvatar = ({ user, size = 'md' }) => {
  const dimension = sizes[size] || sizes.md;
  return (
    <Tooltip title={user?.name || 'Unknown user'}>
      <Avatar
        src={user?.photoUrl}
        sx={{
          width: dimension,
          height: dimension,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: dimension <= 24 ? '0.7rem' : '0.85rem',
          fontWeight: 700,
        }}
      >
        {user?.initials || user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || '?'}
      </Avatar>
    </Tooltip>
  );
};

export default UserAvatar;
