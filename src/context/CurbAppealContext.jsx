import { createContext, useContext, useMemo, useState } from 'react';
import { curbAppealChecklistTemplate, initialCurbAppealSubmissions } from '../data/curbAppeal';

const CurbAppealContext = createContext(null);

const getNeedsCorrectionCount = (submission) => (
  submission.responses.filter((response) => response.value === 'needs_correction').length
);

export const CurbAppealProvider = ({ children }) => {
  const [submissions, setSubmissions] = useState(initialCurbAppealSubmissions);

  const updateSubmission = (id, updater) => {
    setSubmissions((current) => current.map((submission) => (
      submission.id === id ? updater(submission) : submission
    )));
  };

  const submitChecklist = (id, responses) => {
    updateSubmission(id, (submission) => ({
      ...submission,
      responses,
      status: 'submitted_pending_review',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      creditedAt: null,
      reviewNote: '',
    }));
  };

  const approveSubmission = (id) => {
    updateSubmission(id, (submission) => ({
      ...submission,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      creditedAt: new Date().toISOString(),
      reviewNote: 'Approved by Jaime. Credited toward portfolio completion.',
    }));
  };

  const requestFollowUp = (id, note = 'Please update the checklist items that need correction and resubmit.') => {
    updateSubmission(id, (submission) => ({
      ...submission,
      status: 'needs_follow_up',
      reviewedAt: new Date().toISOString(),
      creditedAt: null,
      reviewNote: note,
    }));
  };

  const value = useMemo(() => {
    const expected = submissions.length;
    const approved = submissions.filter((submission) => submission.status === 'approved').length;
    const pendingReview = submissions.filter((submission) => submission.status === 'submitted_pending_review').length;
    const needsFollowUp = submissions.filter((submission) => submission.status === 'needs_follow_up').length;
    const scheduled = submissions.filter((submission) => submission.status === 'scheduled').length;
    const needsCorrection = submissions.reduce((sum, submission) => sum + getNeedsCorrectionCount(submission), 0);
    const priorityProgress = expected ? Math.round((approved / expected) * 100) : 0;

    return {
      approveSubmission,
      checklistTemplate: curbAppealChecklistTemplate,
      getNeedsCorrectionCount,
      getSubmissionById: (id) => submissions.find((submission) => submission.id === id),
      requestFollowUp,
      submitChecklist,
      submissions,
      summary: {
        approved,
        expected,
        needsCorrection,
        needsFollowUp,
        pendingReview,
        priorityProgress,
        scheduled,
      },
    };
  }, [submissions]);

  return (
    <CurbAppealContext.Provider value={value}>
      {children}
    </CurbAppealContext.Provider>
  );
};

export const useCurbAppeal = () => {
  const context = useContext(CurbAppealContext);
  if (!context) {
    throw new Error('useCurbAppeal must be used inside a CurbAppealProvider');
  }

  return context;
};

