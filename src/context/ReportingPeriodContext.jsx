import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { reportingPeriodFromRow } from '../data/recordAdapters';
import {
  getCurrentReportingPeriodId,
  setReportingPeriodCatalog,
} from '../data/reportingPeriods';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const ReportingPeriodContext = createContext(null);

export const ReportingPeriodProvider = ({ children, initialPeriods = null }) => {
  const { isAuthenticated, user } = useAuth();
  const [reportingPeriods, setReportingPeriods] = useState(initialPeriods || []);
  const [selectedPeriodId, setSelectedPeriodIdState] = useState(() => {
    if (!initialPeriods?.length) return '';
    const current = getCurrentReportingPeriodId();
    return initialPeriods.some((period) => period.id === current)
      ? current
      : initialPeriods.at(-1).id;
  });
  const [isLoading, setIsLoading] = useState(!initialPeriods);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPeriods) {
      setReportingPeriodCatalog(initialPeriods);
      setReportingPeriods(initialPeriods);
      setSelectedPeriodIdState((current) => current || (
        initialPeriods.some((period) => period.id === getCurrentReportingPeriodId())
          ? getCurrentReportingPeriodId()
          : initialPeriods.at(-1)?.id || ''
      ));
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated || !user?.organizationId || !supabase) {
      setReportingPeriods([]);
      setReportingPeriodCatalog([]);
      setSelectedPeriodIdState('');
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    supabase
      .from('reporting_periods')
      .select('*')
      .eq('organization_id', user.organizationId)
      .gte('starts_on', '2026-04-01')
      .order('starts_on')
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError(queryError.message);
          setIsLoading(false);
          return;
        }
        const periods = (data || []).map((row) => reportingPeriodFromRow(row));
        setReportingPeriods(periods);
        setReportingPeriodCatalog(periods);
        setSelectedPeriodIdState((current) => {
          if (periods.some((period) => period.id === current)) return current;
          const currentPeriodId = getCurrentReportingPeriodId();
          return periods.some((period) => period.id === currentPeriodId)
            ? currentPeriodId
            : periods.at(-1)?.id || '';
        });
        setError('');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialPeriods, isAuthenticated, user?.organizationId]);

  const setSelectedPeriodId = (value) => {
    if (reportingPeriods.some((period) => period.id === value)) {
      setSelectedPeriodIdState(value);
    }
  };

  const value = useMemo(() => {
    const selectedIndex = reportingPeriods.findIndex((period) => period.id === selectedPeriodId);
    const selectedPeriod = reportingPeriods[selectedIndex] || null;

    return {
      error,
      goToNextPeriod: () => {
        const next = reportingPeriods[selectedIndex + 1];
        if (next) setSelectedPeriodIdState(next.id);
      },
      goToPreviousPeriod: () => {
        const previous = reportingPeriods[selectedIndex - 1];
        if (previous) setSelectedPeriodIdState(previous.id);
      },
      hasNextPeriod: selectedIndex >= 0 && selectedIndex < reportingPeriods.length - 1,
      hasPreviousPeriod: selectedIndex > 0,
      isLoading,
      reportingPeriods,
      selectedPeriod,
      selectedPeriodId,
      selectedPeriodRecordId: selectedPeriod?.databaseId || null,
      setSelectedPeriodId,
    };
  }, [error, isLoading, reportingPeriods, selectedPeriodId]);

  return <ReportingPeriodContext.Provider value={value}>{children}</ReportingPeriodContext.Provider>;
};

export const useReportingPeriod = () => {
  const context = useContext(ReportingPeriodContext);
  if (!context) throw new Error('useReportingPeriod must be used within ReportingPeriodProvider');
  return context;
};
