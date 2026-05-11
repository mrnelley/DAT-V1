import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const PageWrapper = ({ children }) => {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
