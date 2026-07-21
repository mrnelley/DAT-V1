import { createContext, useContext, useMemo, useState } from 'react';
import {
  getCurrentReportingPeriodId,
  getReportingPeriod,
  normalizeReportingPeriodId,
  reportingPeriods,
} from '../data/reportingPeriods';

const ReportingPeriodContext = createContext(null);

export const ReportingPeriodProvider = ({ children }) => {
  const [selectedPeriodId, setSelectedPeriodIdState] = useState(getCurrentReportingPeriodId);

  const setSelectedPeriodId = (value) => {
    setSelectedPeriodIdState((current) => normalizeReportingPeriodId(value, current));
  };

  const value = useMemo(() => {
    const selectedIndex = reportingPeriods.findIndex((period) => period.id === selectedPeriodId);

    return {
      goToNextPeriod: () => {
        const next = reportingPeriods[selectedIndex + 1];
        if (next) setSelectedPeriodIdState(next.id);
      },
      goToPreviousPeriod: () => {
        const previous = reportingPeriods[selectedIndex - 1];
        if (previous) setSelectedPeriodIdState(previous.id);
      },
      hasNextPeriod: selectedIndex < reportingPeriods.length - 1,
      hasPreviousPeriod: selectedIndex > 0,
      reportingPeriods,
      selectedPeriod: getReportingPeriod(selectedPeriodId),
      selectedPeriodId,
      setSelectedPeriodId,
    };
  }, [selectedPeriodId]);

  return <ReportingPeriodContext.Provider value={value}>{children}</ReportingPeriodContext.Provider>;
};

export const useReportingPeriod = () => {
  const context = useContext(ReportingPeriodContext);
  if (!context) throw new Error('useReportingPeriod must be used within ReportingPeriodProvider');
  return context;
};
