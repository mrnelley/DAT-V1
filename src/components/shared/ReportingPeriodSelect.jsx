import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useId } from 'react';
import { useReportingPeriod } from '../../context/ReportingPeriodContext';

const phaseLabels = {
  closed: 'Closed',
  current: 'Current',
  planning: 'Planning',
};

const ReportingPeriodSelect = ({ fullWidth = false, label = 'Reporting Period', onChange, size = 'small', sx, value }) => {
  const {
    reportingPeriods,
    selectedPeriodId,
    setSelectedPeriodId,
  } = useReportingPeriod();
  const inputId = useId();
  const resolvedValue = value ?? selectedPeriodId;

  const handleChange = (event) => {
    if (onChange) {
      onChange(event);
      return;
    }
    setSelectedPeriodId(event.target.value);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size} sx={{ minWidth: 190, ...sx }}>
      <InputLabel id={`${inputId}-label`}>{label}</InputLabel>
      <Select
        label={label}
        labelId={`${inputId}-label`}
        value={resolvedValue}
        onChange={handleChange}
      >
        {reportingPeriods.map((period) => (
          <MenuItem key={period.id} value={period.id}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, width: '100%' }}>
              <Typography component="span" variant="body2">{period.label}</Typography>
              <Typography component="span" variant="caption" color="text.secondary">{phaseLabels[period.phase]}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ReportingPeriodSelect;
