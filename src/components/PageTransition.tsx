import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router';
import { pageTransitionVariants } from '../theme/motionTokens';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Scroll window to top on route change to preserve layout sanity
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [location.pathname]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className="w-full flex-1 flex flex-col min-h-0"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
