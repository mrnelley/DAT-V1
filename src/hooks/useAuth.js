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
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const configurationError = isSupabaseConfigured
    ? ''
    : 'Supabase environment variables are not configured.';

  const hydrateSession = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    try {
      setUser(await loadProfile(nextSession.user.id));
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

    const email = username.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error, user: null };
    await hydrateSession(data.session);
    return { error: null, user: data.user };
  }, [hydrateSession]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(initialUser);
  }, [initialUser]);

  const updateUserProfile = useCallback(async (values) => {
    if (!user) return null;
    const row = await updateProfileRecord(user.id, values);
    const nextUser = {
      ...user,
      avatarUrl: row.avatar_url || '',
      initials: row.initials || user.initials,
      name: row.display_name || row.full_name,
      teams: row.teams || [],
    };
    setUser(nextUser);
    return nextUser;
  }, [user]);

  const reloadUserProfile = useCallback(async () => {
    if (!session?.user) return user;
    const nextUser = await loadProfile(session.user.id);
    setUser(nextUser);
    return nextUser;
  }, [session, user]);

  const value = useMemo(() => ({
    configurationError,
    getToken: async () => session?.access_token || '',
    isAuthenticated: Boolean(user && (initialUser || session)),
    isLoading,
    primaryDashboardPath: getPrimaryDashboardPath(user),
    reloadUserProfile,
    signIn,
    signOut,
    updateUserProfile,
    user,
    userId: user?.id || null,
  }), [
    configurationError,
    initialUser,
    isLoading,
    reloadUserProfile,
    session,
    signIn,
    signOut,
    updateUserProfile,
    user,
  ]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
