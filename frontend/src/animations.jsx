import { Children, cloneElement } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const easeStandard = [0.22, 1, 0.36, 1];

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: easeStandard },
  },
};

export function AnimatedPage({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.995 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeStandard }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className = "", delay = 0, ...props }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.16 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay, ease: easeStandard }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedList({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: false, amount: 0.15 }}
      variants={staggerContainer}
    >
      {Children.map(children, (child) =>
        child ? cloneElement(child, { variants: child.props.variants || staggerItem }) : child
      )}
    </motion.div>
  );
}

export function AnimatedCard({ children, className = "", delay = 0, ...props }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.42, delay, ease: easeStandard }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedButton({ children, className = "", ...props }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      className={className}
      whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 370, damping: 26 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
