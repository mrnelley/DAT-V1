import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import ScheduleSendOutlinedIcon from '@mui/icons-material/ScheduleSendOutlined';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { curbAppealStatusColors, curbAppealStatusLabels } from '../../data/curbAppeal';
import { useCurbAppeal } from '../../context/CurbAppealContext';
import UserAvatar from '../shared/UserAvatar';

const formatDate = (date) => (
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
);

const TeamsCard = ({ actions, children, eyebrow, title }) => (
  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25, bgcolor: 'background.default' }}>
    <Typography variant="caption">{eyebrow}</Typography>
    <Typography variant="h4" sx={{ mt: 0.25 }}>{title}</Typography>
    <Box sx={{ mt: 1 }}>{children}</Box>
    {actions && <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.25 }}>{actions}</Stack>}
  </Box>
);

const CurbAppealWorkflowPanel = () => {
  const navigate = useNavigate();
  const {
    approveSubmission,
    checklistTemplate,
    getNeedsCorrectionCount,
    requestFollowUp,
    submissions,
    summary,
  } = useCurbAppeal();

  const scheduledSubmission = submissions.find((submission) => submission.status === 'scheduled') || submissions[0];
  const pendingReviews = submissions.filter((submission) => submission.status === 'submitted_pending_review');
  const needsFollowUp = submissions.filter((submission) => submission.status === 'needs_follow_up');
  const reviewCard = pendingReviews[0] || needsFollowUp[0] || submissions[0];

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
      <Stack direction={{ xs: 'column', xl: 'row' }} gap={2} justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Stack direction="row" gap={1} alignItems="center">
            <AssignmentTurnedInOutlinedIcon color="primary" />
            <Typography variant="h3">Curb Appeal Checklist Workflow</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Quarterly Teams prompts go to PMs, submissions create Jaime review requests, and approvals credit the linked priority.
          </Typography>
        </Box>
        <Chip label={`${checklistTemplate.cadence} - ${checklistTemplate.dueLabel}`} color="primary" variant="outlined" />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.25, mb: 1.5 }}>
        <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1.25 }}>
          <Typography variant="caption">Priority Credit</Typography>
          <Typography variant="h3">{summary.priorityProgress}%</Typography>
          <LinearProgress value={summary.priorityProgress} variant="determinate" sx={{ mt: 0.75 }} />
        </Box>
        <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1.25 }}>
          <Typography variant="caption">Approved</Typography>
          <Typography variant="h3">{summary.approved}/{summary.expected}</Typography>
          <Typography variant="body2">Credited to Jaime</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1.25 }}>
          <Typography variant="caption">Pending Review</Typography>
          <Typography variant="h3">{summary.pendingReview}</Typography>
          <Typography variant="body2">Waiting on Jaime</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1.25 }}>
          <Typography variant="caption">Follow-up Needed</Typography>
          <Typography variant="h3">{summary.needsFollowUp}</Typography>
          <Typography variant="body2">{summary.needsCorrection} correction flags</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '0.85fr 1.15fr' }, gap: 1.5 }}>
        <Stack gap={1.25}>
          <TeamsCard
            eyebrow="Teams card to Property Manager"
            title={`${scheduledSubmission.propertyName} checklist`}
            actions={[
              <Button
                key="open"
                variant="contained"
                size="small"
                startIcon={<LaunchOutlinedIcon />}
                onClick={() => navigate(`/curb-appeal/${scheduledSubmission.id}`)}
              >
                Open Checklist
              </Button>,
            ]}
          >
            <Stack direction="row" gap={1} alignItems="center">
              <UserAvatar user={scheduledSubmission.propertyManager} size="sm" />
              <Box>
                <Typography variant="body2" color="text.primary" fontWeight={700}>{scheduledSubmission.propertyManager.name}</Typography>
                <Typography variant="caption">Prompt {formatDate(scheduledSubmission.scheduledPromptDate)} - reminder {formatDate(scheduledSubmission.reminderDate)}</Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>Submit by {formatDate(scheduledSubmission.dueDate)} without opening the full dashboard.</Typography>
          </TeamsCard>

          <TeamsCard
            eyebrow="Teams card to Jaime"
            title={`${reviewCard.propertyName} review request`}
            actions={[
              <Button
                key="approve"
                size="small"
                variant="contained"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => approveSubmission(reviewCard.id)}
                disabled={reviewCard.status !== 'submitted_pending_review'}
              >
                Approve
              </Button>,
              <Button
                key="follow"
                size="small"
                variant="outlined"
                startIcon={<ReplyOutlinedIcon />}
                onClick={() => requestFollowUp(reviewCard.id)}
                disabled={reviewCard.status !== 'submitted_pending_review'}
              >
                Request Follow-up
              </Button>,
            ]}
          >
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Chip label={curbAppealStatusLabels[reviewCard.status]} color={curbAppealStatusColors[reviewCard.status]} size="small" />
              <Chip label={`${getNeedsCorrectionCount(reviewCard)} correction flags`} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>Submitted by {reviewCard.propertyManager.name}. Approval is required before this counts toward priority progress.</Typography>
          </TeamsCard>
        </Stack>

        <Box>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <RateReviewOutlinedIcon color="primary" />
            <Typography variant="h4">Jaime Review Requests</Typography>
          </Stack>
          <Table aria-label="Curb appeal review requests" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>PM</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...pendingReviews, ...needsFollowUp].slice(0, 6).map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.primary" fontWeight={700}>{submission.propertyName}</Typography>
                    <Typography variant="caption">Due {formatDate(submission.dueDate)}</Typography>
                  </TableCell>
                  <TableCell>{submission.propertyManager.name}</TableCell>
                  <TableCell>
                    <Chip label={curbAppealStatusLabels[submission.status]} color={curbAppealStatusColors[submission.status]} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" gap={0.5} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => approveSubmission(submission.id)}
                        disabled={submission.status !== 'submitted_pending_review'}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        onClick={() => requestFollowUp(submission.id)}
                        disabled={submission.status !== 'submitted_pending_review'}
                      >
                        Follow-up
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!pendingReviews.length && !needsFollowUp.length && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <ScheduleSendOutlinedIcon color="primary" fontSize="small" />
                      <Typography variant="body2">No review requests waiting right now.</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
};

export default CurbAppealWorkflowPanel;
