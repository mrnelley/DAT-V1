import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { updateProfileRecord } from '../api/supabaseData';
import { profileFromRow } from '../data/recordAdapters';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getAuthEmailForUsername, normalizeUsername } from '../utils/authIdentity';
import { getPrimaryDashboardPath } from '../utils/dashboardRouting';

const AuthContext = createContext(null);

const loadProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      department:departments!profiles_department_id_fkey(*),
      organization:organizations!profiles_organization_id_fkey(*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return profileFromRow(
    data,
    new Map(data.department ? [[data.department.id, data.department]] : []),
    new Map(data.organization ? [[data.organization.id, data.organization]] : []),
  );
};

export const AuthProvider = ({ children, initialUser = null }) => {
  const [session, setSession] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(initialUser);
  const [dashboardPreviewUser, setDashboardPreviewUser] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const configurationError = isSupabaseConfigured
    ? ''
    : 'Supabase environment variables are not configured.';

  const hydrateSession = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setAuthenticatedUser(initialUser);
      setDashboardPreviewUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setAuthenticatedUser(await loadProfile(nextSession.user.id));
      setDashboardPreviewUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [initialUser]);

  useEffect(() => {
    if (initialUser || !supabase) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) hydrateSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) hydrateSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateSession, initialUser]);

  const signIn = useCallback(async ({ password, username }) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.'), user: null };
    }

    const normalizedUsername = normalizeUsername(username);
    const email = normalizedUsername.includes('@')
      ? normalizedUsername
      : getAuthEmailForUsername(normalizedUsername);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error, user: null };
    await hydrateSession(data.session);
    return { error: null, user: data.user };
  }, [hydrateSession]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setAuthenticatedUser(initialUser);
    setDashboardPreviewUser(null);
  }, [initialUser]);

  const updateUserProfile = useCallback(async (values) => {
    if (!authenticatedUser) return null;
    const row = await updateProfileRecord(authenticatedUser.id, values);
    const nextUser = {
      ...authenticatedUser,
      avatarUrl: row.avatar_url || '',
      email: row.email || '',
      firstName: row.first_name,
      initials: row.initials || authenticatedUser.initials,
      lastName: row.last_name || '',
      name: row.display_name || row.full_name || row.first_name,
      teams: row.teams || [],
      username: row.username,
    };
    setAuthenticatedUser(nextUser);
    return nextUser;
  }, [authenticatedUser]);

  const reloadUserProfile = useCallback(async () => {
    if (!session?.user) return authenticatedUser;
    const nextUser = await loadProfile(session.user.id);
    setAuthenticatedUser(nextUser);
    return nextUser;
  }, [authenticatedUser, session]);

  const viewDashboardAs = useCallback((targetUser) => {
    if (
      !authenticatedUser?.isAdmin
      || !targetUser?.id
      || targetUser.organizationId !== authenticatedUser.organizationId
    ) {
      return false;
    }

    setDashboardPreviewUser(
      targetUser.id === authenticatedUser.id ? null : targetUser,
    );
    return true;
  }, [authenticatedUser]);

  const clearDashboardPreview = useCallback(() => {
    setDashboardPreviewUser(null);
  }, []);

  const dashboardUser = dashboardPreviewUser || authenticatedUser;
  const isDashboardPreview = Boolean(dashboardPreviewUser);

  const value = useMemo(() => ({
    authenticatedUser,
    clearDashboardPreview,
    configurationError,
    dashboardUser,
    getToken: async () => session?.access_token || '',
    isAuthenticated: Boolean(authenticatedUser && (initialUser || session)),
    isDashboardPreview,
    isLoading,
    primaryDashboardPath: getPrimaryDashboardPath(authenticatedUser),
    reloadUserProfile,
    signIn,
    signOut,
    updateUserProfile,
    user: authenticatedUser,
    userId: authenticatedUser?.id || null,
    viewDashboardAs,
  }), [
    authenticatedUser,
    clearDashboardPreview,
    configurationError,
    dashboardUser,
    initialUser,
    isDashboardPreview,
    isLoading,
    reloadUserProfile,
    session,
    signIn,
    signOut,
    updateUserProfile,
    viewDashboardAs,
  ]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
