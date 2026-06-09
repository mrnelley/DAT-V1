import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import { Box, Button, Chip, Divider, InputAdornment, List, ListItemButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { dictionaryCategories, dictionaryTerms, dictionaryTermsByLetter } from '../../data/learnDictionary';
import PageWrapper from '../layout/PageWrapper';

const alphabet = Object.keys(dictionaryTermsByLetter).sort();

const definitionSections = [
  { field: 'shortDefinition', icon: MenuBookOutlinedIcon, label: 'Software definition' },
  { field: 'translation', icon: TranslateOutlinedIcon, label: 'Plain English' },
  { field: 'dataObject', icon: DataObjectOutlinedIcon, label: 'Programmatic distinction' },
  { field: 'cadence', icon: ScheduleOutlinedIcon, label: 'Cadence' },
  { field: 'not', icon: BlockOutlinedIcon, label: 'What it is not' },
];

const normalize = (value) => value.toLowerCase().trim();

const matchesQuery = (term, query) => {
  const target = normalize(query);
  if (!target) return true;

  return [
    term.term,
    term.category,
    term.shortDefinition,
    term.translation,
    term.dataObject,
    term.cadence,
    term.not,
    ...(term.appears || []),
    ...(term.related || []),
    ...(term.contexts || []).flatMap((context) => [context.label, context.definition]),
  ].some((value) => normalize(String(value)).includes(target));
};

const TermButton = ({ active, onClick, term }) => (
  <ListItemButton
    selected={active}
    onClick={onClick}
    sx={{
      borderLeft: '3px solid',
      borderLeftColor: active ? 'background.accent' : 'transparent',
      borderRadius: 0,
      color: active ? '#ffffff' : 'rgba(255,255,255,0.72)',
      px: 1.25,
      py: 0.9,
      '&.Mui-selected': {
        bgcolor: 'rgba(239,220,156,0.12)',
      },
      '&.Mui-selected:hover, &:hover': {
        bgcolor: 'rgba(94,184,168,0.12)',
        color: '#ffffff',
      },
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="inherit" fontWeight={active ? 800 : 600} noWrap>{term.term}</Typography>
      <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>{term.category}</Typography>
    </Box>
  </ListItemButton>
);

const DefinitionRow = ({ section, term }) => {
  const Icon = section.icon;

  return (
    <Box component="section" sx={{ borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.12)', py: 1.6 }}>
      <Stack direction="row" gap={1.25} alignItems="flex-start">
        <Icon sx={{ color: 'background.accent', mt: 0.2 }} fontSize="small" />
        <Box>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.58)', letterSpacing: 0.8 }}>{section.label}</Typography>
          <Typography variant="body1" sx={{ color: '#ffffff', fontSize: '0.98rem', lineHeight: 1.6 }}>
            {term[section.field]}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

const LearnPage = () => {
  const [activeTool, setActiveTool] = useState(null);
  const [category, setCategory] = useState('All');
  const [letter, setLetter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(dictionaryTerms[0]);

  const visibleTerms = useMemo(() => dictionaryTerms
    .filter((term) => category === 'All' || term.category === category)
    .filter((term) => letter === 'All' || term.term.startsWith(letter))
    .filter((term) => matchesQuery(term, query))
    .sort((a, b) => a.term.localeCompare(b.term)), [category, letter, query]);

  const groupedTerms = useMemo(() => visibleTerms.reduce((groups, term) => {
    const key = term.term[0].toUpperCase();
    return {
      ...groups,
      [key]: [...(groups[key] || []), term],
    };
  }, {}), [visibleTerms]);

  const chooseTerm = (term) => {
    setSelectedTerm(term);
    setQuery(term.term);
  };

  const searchDictionary = (event) => {
    const value = event.target.value;
    const target = normalize(value);
    const bestMatch = target
      ? dictionaryTerms.find((term) => normalize(term.term) === target)
        || dictionaryTerms.find((term) => normalize(term.term).startsWith(target))
        || dictionaryTerms.find((term) => matchesQuery(term, value))
      : null;

    setCategory('All');
    setLetter('All');
    setQuery(value);
    if (bestMatch) setSelectedTerm(bestMatch);
  };

  const resetFilters = () => {
    setCategory('All');
    setLetter('All');
    setQuery('');
  };

  return (
    <PageWrapper>
      <Box
        sx={{
          bgcolor: '#202441',
          color: '#ffffff',
          minHeight: 'calc(100vh - 64px)',
          m: { xs: -2, md: -3 },
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            animation: 'dictionaryWave 26s linear infinite',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='620' height='90' viewBox='0 0 620 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 45 C 42 16, 82 72, 124 45 S 206 16, 248 45 S 330 74, 372 45 S 454 16, 496 45 S 578 72, 620 45' fill='none' stroke='%235eb8a8' stroke-width='2.4' stroke-linecap='round' stroke-opacity='.7'/%3E%3Cpath d='M0 45 C 58 30, 86 60, 146 45 S 236 28, 300 45 S 410 61, 466 45 S 560 32, 620 45' fill='none' stroke='%23efdc9c' stroke-width='1.3' stroke-linecap='round' stroke-opacity='.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '620px 90px',
            content: '""',
            height: 90,
            left: 0,
            opacity: 0.55,
            position: 'absolute',
            right: 0,
            top: 18,
          },
          '@keyframes dictionaryWave': {
            from: { backgroundPositionX: 0 },
            to: { backgroundPositionX: 620 },
          },
        }}
      >
        <Box sx={{ position: 'relative', px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3 } }}>
          {activeTool !== 'dictionary' ? (
            <Stack sx={{ minHeight: 'calc(100vh - 112px)' }}>
              <Box sx={{ maxWidth: 760, mb: { xs: 5, md: 8 } }}>
                <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
                  <AutoStoriesOutlinedIcon sx={{ color: 'background.accent' }} />
                  <Typography variant="overline" sx={{ color: 'background.accent', letterSpacing: 1 }}>Learn</Typography>
                </Stack>
                <Typography variant="h1" sx={{ color: '#ffffff', fontSize: { xs: '2rem', md: '2.7rem' }, lineHeight: 1.05 }}>
                  Learn
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.74)', maxWidth: 650, mt: 1 }}>
                  Build fluency in Compass and the operating model behind it.
                </Typography>
              </Box>

              <List disablePadding sx={{ borderTop: '1px solid rgba(239,220,156,0.45)' }}>
                <ListItemButton
                  onClick={() => setActiveTool('dictionary')}
                  sx={{
                    borderBottom: '1px solid rgba(239,220,156,0.45)',
                    borderRadius: 0,
                    color: '#ffffff',
                    gap: 2,
                    px: { xs: 0, md: 1.5 },
                    py: { xs: 2.25, md: 2.75 },
                    '&:hover': { bgcolor: 'rgba(94,184,168,0.12)' },
                  }}
                >
                  <MenuBookOutlinedIcon sx={{ color: 'background.accent', fontSize: 34 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h2" sx={{ color: '#ffffff' }}>Dictionary</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', mt: 0.5 }}>
                      Software definitions, plain-English translations, and programmatic distinctions.
                    </Typography>
                  </Box>
                  <ArrowForwardOutlinedIcon sx={{ color: 'background.accent' }} />
                </ListItemButton>
              </List>
            </Stack>
          ) : (
            <>
          <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 2.5 }}>
            <Box sx={{ maxWidth: 760 }}>
              <Button
                onClick={() => setActiveTool(null)}
                startIcon={<ArrowBackOutlinedIcon />}
                sx={{ color: 'rgba(255,255,255,0.74)', mb: 1, px: 0 }}
              >
                Learn
              </Button>
              <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
                <MenuBookOutlinedIcon sx={{ color: 'background.accent' }} />
                <Typography variant="overline" sx={{ color: 'background.accent', letterSpacing: 1 }}>Dictionary</Typography>
              </Stack>
              <Typography variant="h1" sx={{ color: '#ffffff', fontSize: { xs: '2rem', md: '2.7rem' }, lineHeight: 1.05 }}>
                Compass Dictionary
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.74)', maxWidth: 650, mt: 1 }}>
                Software definitions, plain-English translations, and programmatic distinctions for the operating model.
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', lg: 430 } }}>
              <TextField
                fullWidth
                inputProps={{ 'aria-label': 'Search the dictionary' }}
                onChange={searchDictionary}
                placeholder="Search the dictionary"
                type="search"
                value={query}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 1 },
                  '& input::placeholder': {
                    color: 'text.secondary',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          </Stack>

          <Stack gap={1.25} sx={{ mb: 2 }}>
            <ToggleButtonGroup
              exclusive
              value={category}
              onChange={(_, value) => value && setCategory(value)}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 1,
                  color: 'rgba(255,255,255,0.76)',
                  mx: '0 !important',
                  '&.Mui-selected': {
                    bgcolor: 'background.accent',
                    color: 'text.primary',
                  },
                },
              }}
            >
              {['All', ...dictionaryCategories].map((item) => (
                <ToggleButton key={item} value={item}>{item}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.62)', mr: 0.75 }}>Alphabet</Typography>
              {['All', ...alphabet].map((item) => (
                <Button
                  key={item}
                  size="small"
                  onClick={() => setLetter(item)}
                  sx={{
                    borderBottom: '2px solid',
                    borderBottomColor: letter === item ? 'background.accent' : 'transparent',
                    borderRadius: 0,
                    color: letter === item ? 'background.accent' : 'rgba(255,255,255,0.7)',
                    minHeight: 30,
                    minWidth: item === 'All' ? 42 : 30,
                    px: 0.8,
                  }}
                >
                  {item}
                </Button>
              ))}
              {(category !== 'All' || letter !== 'All' || query) && (
                <Button size="small" onClick={resetFilters} sx={{ color: '#ffffff', ml: 0.5 }}>Clear</Button>
              )}
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2, lg: 0 },
              gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' },
              minHeight: 620,
            }}
          >
            <Box
              sx={{
                border: '1px solid rgba(239,220,156,0.45)',
                borderRight: { lg: 0 },
                maxHeight: { xs: 360, lg: 720 },
                overflow: 'auto',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)', px: 1.25, py: 1 }}>
                <Stack direction="row" gap={1} alignItems="center">
                  <CategoryOutlinedIcon fontSize="small" sx={{ color: 'background.accent' }} />
                  <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>{visibleTerms.length} terms</Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>{category}</Typography>
              </Stack>
              <List disablePadding>
                {Object.entries(groupedTerms).map(([groupLetter, terms]) => (
                  <Box key={groupLetter}>
                    <Typography variant="caption" sx={{ color: 'background.accent', display: 'block', px: 1.25, py: 0.75 }}>{groupLetter}</Typography>
                    {terms.map((term) => (
                      <TermButton
                        key={term.term}
                        active={selectedTerm.term === term.term}
                        onClick={() => chooseTerm(term)}
                        term={term}
                      />
                    ))}
                  </Box>
                ))}
                {!visibleTerms.length && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', p: 2 }}>
                    No dictionary terms match the current filters.
                  </Typography>
                )}
              </List>
            </Box>

            <Box
              component="article"
              sx={{
                border: '1px solid rgba(239,220,156,0.45)',
                minHeight: 620,
                position: 'relative',
                px: { xs: 2, md: 3 },
                py: { xs: 2, md: 3 },
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="overline" sx={{ color: 'background.accent', letterSpacing: 1 }}>{selectedTerm.category}</Typography>
                  <Typography variant="h2" sx={{ color: '#ffffff', fontSize: { xs: '2rem', md: '2.45rem' }, lineHeight: 1.08 }}>
                    {selectedTerm.term}
                  </Typography>
                </Box>
                <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="flex-start">
                  {selectedTerm.related.slice(0, 3).map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      onClick={() => {
                        const match = dictionaryTerms.find((term) => term.term === item);
                        if (match) chooseTerm(match);
                      }}
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.14)' }}
                    />
                  ))}
                </Stack>
              </Stack>

              {definitionSections.map((section) => (
                <DefinitionRow key={section.field} section={section} term={selectedTerm} />
              ))}

              {selectedTerm.contexts?.length > 0 && (
                <Box component="section" sx={{ borderTop: '1px solid rgba(255,255,255,0.12)', py: 1.6 }}>
                  <Stack direction="row" gap={1.25} alignItems="flex-start" sx={{ mb: 1.25 }}>
                    <AccountTreeOutlinedIcon sx={{ color: 'background.accent', mt: 0.2 }} fontSize="small" />
                    <Box>
                      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.58)', letterSpacing: 0.8 }}>Context definitions</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Same word, different source and use.
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
                    {selectedTerm.contexts.map((context) => (
                      <Box key={context.label} sx={{ borderLeft: '3px solid', borderLeftColor: 'secondary.main', pl: 1.25, py: 0.75 }}>
                        <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>{context.label}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>{context.definition}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Box component="section" sx={{ borderTop: '1px solid rgba(255,255,255,0.12)', py: 1.6 }}>
                <Stack direction="row" gap={1.25} alignItems="flex-start">
                  <PlaceOutlinedIcon sx={{ color: 'background.accent', mt: 0.2 }} fontSize="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.58)', letterSpacing: 0.8 }}>Where it appears</Typography>
                    <Stack direction="row" gap={0.75} flexWrap="wrap">
                      {selectedTerm.appears.map((item) => (
                        <Chip key={item} label={item} sx={{ bgcolor: 'rgba(94,184,168,0.16)', color: '#ffffff' }} />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 0.5 }} />

              <Stack direction="row" gap={1.25} alignItems="flex-start" sx={{ py: 1.6 }}>
                <LinkOutlinedIcon sx={{ color: 'background.accent', mt: 0.2 }} fontSize="small" />
                <Box>
                  <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.58)', letterSpacing: 0.8 }}>Related terms</Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {selectedTerm.related.map((item) => {
                      const match = dictionaryTerms.find((term) => term.term === item);

                      return (
                        <Button
                          key={item}
                          onClick={() => match && chooseTerm(match)}
                          disabled={!match}
                          sx={{
                            borderBottom: '1px solid',
                            borderBottomColor: match ? 'background.accent' : 'rgba(255,255,255,0.18)',
                            borderRadius: 0,
                            color: match ? 'background.accent' : 'rgba(255,255,255,0.45)',
                            minHeight: 32,
                          }}
                        >
                          {item}
                        </Button>
                      );
                    })}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
            </>
          )}
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default LearnPage;
