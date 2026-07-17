import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getPracticeProgram, getPracticeTask } from '../data/guidedPracticePrograms';

const GuidedPracticeContext = createContext(null);

export const GuidedPracticeProvider = ({ children }) => {
  const [session, setSession] = useState(null);

  const startPractice = useCallback((programId, taskId) => {
    const program = getPracticeProgram(programId);
    const task = getPracticeTask(program.id, taskId);
    if (!task) return null;

    const nextSession = {
      programId: program.id,
      stepIndex: 0,
      taskId: task.id,
    };
    setSession(nextSession);
    return task.steps[0] || null;
  }, []);

  const setPracticeStep = useCallback((stepIndex) => {
    setSession((current) => current ? { ...current, stepIndex } : current);
  }, []);

  const endPractice = useCallback(() => {
    setSession(null);
  }, []);

  const activeProgram = session ? getPracticeProgram(session.programId) : null;
  const activeTask = session ? getPracticeTask(session.programId, session.taskId) : null;
  const activeStep = activeTask?.steps[session.stepIndex] || null;

  const value = useMemo(() => ({
    activeProgram,
    activeStep,
    activeTask,
    endPractice,
    session,
    setPracticeStep,
    startPractice,
  }), [activeProgram, activeStep, activeTask, endPractice, session, setPracticeStep, startPractice]);

  return (
    <GuidedPracticeContext.Provider value={value}>
      {children}
    </GuidedPracticeContext.Provider>
  );
};

export const useGuidedPractice = () => {
  const context = useContext(GuidedPracticeContext);
  if (!context) {
    throw new Error('useGuidedPractice must be used inside GuidedPracticeProvider');
  }

  return context;
};
