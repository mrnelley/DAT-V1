import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  deleteFeatureOverrides,
  loadFeatureOverrides,
  saveFeatureOverride,
} from '../api/supabaseData';
import { baseFeatureKeys, featureCatalog, featureCatalogByKey } from '../data/featureCatalog';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';

const FeatureAccessContext = createContext(null);

const adminGroups = ['ELT'];
const adminRoles = ['Administrator', 'CEO'];
const defaultOffFeatureKeys = ['taskView'];

const userCanAdminister = (user) => adminRoles.includes(user.role) || adminGroups.includes(user.workingGroup);

const defaultEnabledFor = (featureKey, user) => {
  if (baseFeatureKeys.includes(featureKey)) return true;
  if (defaultOffFeatureKeys.includes(featureKey)) return false;
  if (featureCatalogByKey[featureKey]?.category === 'Administration') return userCanAdminister(user);
  return true;
};

const groupOverrides = (rows) => rows.reduce((grouped, row) => ({
  ...grouped,
  [row.profile_id]: {
    ...(grouped[row.profile_id] || {}),
    [row.feature_key]: row.enabled,
  },
}), {});

export const FeatureAccessProvider = ({ children, initialOverrides = null }) => {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState(initialOverrides || {});

  useEffect(() => {
    if (initialOverrides || !isSupabaseConfigured || !user) return;
    loadFeatureOverrides().then((rows) => setOverrides(groupOverrides(rows))).catch(() => setOverrides({}));
  }, [initialOverrides, user]);

  const isFeatureEnabled = useCallback((featureKey, userOverride = user) => {
    if (!featureKey) return true;
    const value = overrides[userOverride.id]?.[featureKey];
    return typeof value === 'boolean' ? value : defaultEnabledFor(featureKey, userOverride);
  }, [overrides, user]);

  const setUserFeature = useCallback((userId, featureKey, enabled) => {
    setOverrides((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] || {}),
        [featureKey]: enabled,
      },
    }));
    if (isSupabaseConfigured) {
      saveFeatureOverride({
        enabled,
        featureKey,
        organizationId: user.organizationId,
        setBy: user.id,
        userId,
      }).catch(() => {});
    }
  }, [user]);

  const resetUserFeatures = useCallback((userId) => {
    setOverrides((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
    if (isSupabaseConfigured) deleteFeatureOverrides(userId).catch(() => {});
  }, []);

  const getUserFeatureConfig = useCallback((targetUser) => (
    Object.fromEntries(featureCatalog.map((feature) => [
      feature.key,
      isFeatureEnabled(feature.key, targetUser),
    ]))
  ), [isFeatureEnabled]);

  const value = useMemo(() => ({
    featureCatalog,
    getUserFeatureConfig,
    isFeatureEnabled,
    resetUserFeatures,
    setUserFeature,
    userCanAdminister,
  }), [getUserFeatureConfig, isFeatureEnabled, resetUserFeatures, setUserFeature]);

  return (
    <FeatureAccessContext.Provider value={value}>
      {children}
    </FeatureAccessContext.Provider>
  );
};

export const useFeatureAccess = () => {
  const context = useContext(FeatureAccessContext);
  if (!context) {
    throw new Error('useFeatureAccess must be used inside a FeatureAccessProvider');
  }

  return context;
};
