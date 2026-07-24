import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadChecklistData,
  reviewChecklistRecord,
  submitChecklistRecord,
} from '../api/supabaseData';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';

const CurbAppealContext = createContext(null);

const getNeedsCorrectionCount = (submission) => (
  submission.responses.filter((response) => response.value === 'needs_correction').length
);

const mapChecklistData = (records) => {
  const propertiesById = new Map(records.properties.map((property) => [property.id, property]));
  const profilesById = new Map(records.profiles.map((profile) => [profile.id, {
    id: profile.id,
    name: profile.display_name || profile.full_name,
    role: profile.role_title || '',
  }]));
  const itemsBySection = records.items.reduce((groups, item) => {
    const current = groups.get(item.section_id) || [];
    current.push({ id: item.id, label: item.label });
    groups.set(item.section_id, current);
    return groups;
  }, new Map());
  const sectionsByTemplate = records.sections.reduce((groups, section) => {
    const current = groups.get(section.template_id) || [];
    current.push({
      id: section.id,
      items: itemsBySection.get(section.id) || [],
      title: section.title,
    });
    groups.set(section.template_id, current);
    return groups;
  }, new Map());
  const templates = records.templates.map((template) => ({
    cadence: template.cadence,
    dueDay: template.due_day,
    dueLabel: template.due_day ? `Due by day ${template.due_day}` : 'Due date set per submission',
    id: template.id,
    sections: sectionsByTemplate.get(template.id) || [],
    title: template.title,
  }));
  const responsesBySubmission = records.responses.reduce((groups, response) => {
    const current = groups.get(response.submission_id) || [];
    current.push({
      comments: response.comments || '',
      correctionDate: response.correction_due_on || '',
      itemId: response.item_id,
      value: response.response_value || '',
    });
    groups.set(response.submission_id, current);
    return groups;
  }, new Map());
  const submissions = records.submissions.map((submission) => ({
    checklistTemplateId: submission.template_id,
    creditedAt: submission.credited_at,
    dueDate: submission.due_on,
    id: submission.id,
    propertyAddress: [
      propertiesById.get(submission.property_id)?.address,
      propertiesById.get(submission.property_id)?.city,
      propertiesById.get(submission.property_id)?.state,
    ].filter(Boolean).join(', '),
    propertyId: submission.property_id,
    propertyManager: profilesById.get(submission.assigned_to),
    propertyName: propertiesById.get(submission.property_id)?.name || 'Unassigned property',
    reminderDate: submission.reminder_on,
    reportingPeriodId: submission.reporting_period_id,
    responses: responsesBySubmission.get(submission.id) || [],
    reviewedAt: submission.reviewed_at,
    reviewer: profilesById.get(submission.reviewer_id),
    reviewNote: submission.review_note || '',
    scheduledPromptDate: submission.prompt_on,
    status: submission.status,
    submittedAt: submission.submitted_at,
  }));

  return { submissions, templates };
};

export const CurbAppealProvider = ({ children, initialData = null }) => {
  const { user } = useAuth();
  const [data, setData] = useState(initialData || { submissions: [], templates: [] });
  const persistenceEnabled = !initialData && isSupabaseConfigured && Boolean(user);

  const refresh = useCallback(async () => {
    if (!persistenceEnabled) return;
    setData(mapChecklistData(await loadChecklistData()));
  }, [persistenceEnabled]);

  useEffect(() => {
    refresh().catch(() => setData({ submissions: [], templates: [] }));
  }, [refresh]);

  const updateSubmission = useCallback((id, updater) => {
    setData((current) => ({
      ...current,
      submissions: current.submissions.map((submission) => (
        submission.id === id ? updater(submission) : submission
      )),
    }));
  }, []);

  const submitChecklist = useCallback((id, responses) => {
    updateSubmission(id, (submission) => ({
      ...submission,
      creditedAt: null,
      responses,
      reviewedAt: null,
      reviewNote: '',
      status: 'submitted_pending_review',
      submittedAt: new Date().toISOString(),
    }));
    if (persistenceEnabled) {
      submitChecklistRecord(id, responses).then(refresh).catch(() => {});
    }
  }, [persistenceEnabled, refresh, updateSubmission]);

  const reviewSubmission = useCallback((id, approved, note = '') => {
    const reviewedAt = new Date().toISOString();
    updateSubmission(id, (submission) => ({
      ...submission,
      creditedAt: approved ? reviewedAt : null,
      reviewedAt,
      reviewNote: note,
      status: approved ? 'approved' : 'needs_follow_up',
    }));
    if (persistenceEnabled) {
      reviewChecklistRecord(id, { approved, note }).then(refresh).catch(() => {});
    }
  }, [persistenceEnabled, refresh, updateSubmission]);

  const value = useMemo(() => {
    const expected = data.submissions.length;
    const approved = data.submissions.filter((submission) => submission.status === 'approved').length;
    const pendingReview = data.submissions.filter((submission) => submission.status === 'submitted_pending_review').length;
    const needsFollowUp = data.submissions.filter((submission) => submission.status === 'needs_follow_up').length;
    const scheduled = data.submissions.filter((submission) => submission.status === 'scheduled').length;
    const needsCorrection = data.submissions.reduce(
      (sum, submission) => sum + getNeedsCorrectionCount(submission),
      0,
    );

    return {
      approveSubmission: (id, note = '') => reviewSubmission(id, true, note),
      checklistTemplate: data.templates[0] || null,
      getNeedsCorrectionCount,
      getSubmissionById: (id) => data.submissions.find((submission) => submission.id === id),
      requestFollowUp: (id, note = '') => reviewSubmission(id, false, note),
      submissions: data.submissions,
      submitChecklist,
      summary: {
        approved,
        expected,
        needsCorrection,
        needsFollowUp,
        pendingReview,
        priorityProgress: expected ? Math.round((approved / expected) * 100) : 0,
        scheduled,
      },
    };
  }, [data, reviewSubmission, submitChecklist]);

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
