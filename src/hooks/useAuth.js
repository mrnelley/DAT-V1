const currentUser = {
  id: 'u1',
  name: 'Parnell Kelley',
  initials: 'PK',
  role: 'ELT',
  organization: 'HDC MidAtlantic',
  teams: ['Critical Numbers for Leadership', 'Operations', 'Resident Services'],
};

export const useAuth = () => ({
  user: currentUser,
  getToken: async () => 'development-token',
});
