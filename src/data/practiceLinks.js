export const practiceAppUrls = {
  ELT: 'https://dat-practice-rn98.vercel.app/learn/ELT',
  OLT: 'https://dat-practice-rn98.vercel.app/learn/OLT',
};

export const getPracticeAppUrl = (workingGroup) => (
  practiceAppUrls[workingGroup === 'ELT' ? 'ELT' : 'OLT']
);
