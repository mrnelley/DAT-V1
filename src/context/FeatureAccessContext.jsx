import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { baseFeatureKeys, featureCatalog, featureCatalogByKey } from '../data/featureCatalog';
import { useAuth } from '../hooks/useAuth';

const FeatureAccessContext = createContext(null);

const storageKey = 'hdc_compass_feature_rollout';
const adminGroups = ['ELT'];
const adminRoles = ['Administrator', 'CEO'];

const readStoredOverrides = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
};

const userCanAdminister = (user) => adminRoles.includes(user.role) || adminGroups.includes(user.workingGroup);

const defaultEnabledFor = (featureKey, user) => {
  if (baseFeatureKeys.includes(featureKey)) return true;
  if (featureCatalogByKey[featureKey]?.category === 'Administration') return userCanAdminister(user);
  return true;
};

export const FeatureAccessProvider = ({ children }) => {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState(readStoredOverrides);

  const saveOverrides = useCallback((nextOverrides) => {
    setOverrides(nextOverrides);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(nextOverrides));
    }
  }, []);

  const isFeatureEnabled = useCallback((featureKey, userOverride = user) => {
    if (!featureKey) return true;
    const value = overrides[userOverride.id]?.[featureKey];
    return typeof value === 'boolean' ? value : defaultEnabledFor(featureKey, userOverride);
  }, [overrides, user]);

  const setUserFeature = useCallback((userId, featureKey, enabled) => {
    saveOverrides({
      ...overrides,
      [userId]: {
        ...(overrides[userId] || {}),
        [featureKey]: enabled,
      },
    });
  }, [overrides, saveOverrides]);

  const resetUserFeatures = useCallback((userId) => {
    const nextOverrides = { ...overrides };
    delete nextOverrides[userId];
    saveOverrides(nextOverrides);
  }, [overrides, saveOverrides]);

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
