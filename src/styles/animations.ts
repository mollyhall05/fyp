// Animation variants for consistent motion across the app
export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemFadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Common card styles
export const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  },
  hover: {
    y: -4,
    transition: { duration: 0.2 }
  }
};

// Common button variants
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.03,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};
