"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

export const EYVA_EASE: [number, number, number, number] = [0.2, 0, 0, 1];

export const EYVA_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.75,
};

export const EYVA_GENTLE_SPRING = {
  type: "spring" as const,
  stiffness: 290,
  damping: 28,
  mass: 0.85,
};

/** Page-level entrance wrapper used in route templates and auth views. */
export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: EYVA_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-triggered section reveal (`once: true`, `amount: 0.2`). */
export function RevealSection({
  children,
  className = "",
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.38, delay, ease: EYVA_EASE }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/** Staggered container for card grids, form fields, and lists. */
export function StaggerContainer({
  children,
  className = "",
  stagger = 0.065,
  delayChildren = 0.02,
  inView = false,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  inView?: boolean;
}) {
  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };

  if (inView) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual child item inside a StaggerContainer. */
export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: EYVA_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tactile card with GPU-friendly spring lift and pointer-tracked lavender/yellow spotlight
 * (zero React state updates during pointer movement).
 */
export function InteractiveCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 242, 56, 0.18)",
  lift = -3,
  ...rest
}: HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  lift?: number;
}) {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const spotlightBg = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, rgba(242, 236, 255, 0.22) 45%, transparent 80%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      whileHover={prefersReduced ? undefined : { y: lift }}
      transition={EYVA_SPRING}
      className={`group relative overflow-hidden ${className}`}
      {...rest}
    >
      {!prefersReduced && (
        <motion.div
          aria-hidden="true"
          style={{ background: spotlightBg }}
          className="pointer-events-none absolute -inset-px z-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

/** Tactile button with exact 0.96 press scale and disabled guard. */
export function TactileButton({
  children,
  className = "",
  disabled,
  ...rest
}: HTMLMotionProps<"button"> & {
  children: React.ReactNode;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.button
      whileHover={prefersReduced || disabled ? undefined : { y: -1 }}
      whileTap={prefersReduced || disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.15, ease: EYVA_EASE }}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/**
 * Gentle floating wrapper for Eyva mascot illustrations.
 * Supports an optional accessible pause button (WCAG 2.2.2) for persistent views.
 */
export function FloatingMascot({
  children,
  className = "",
  amplitude = 6,
  duration = 4.2,
  showPauseControl = false,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  showPauseControl?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const isAnimating = !prefersReduced && !paused;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <motion.div
        animate={isAnimating ? { y: [0, -amplitude, 0] } : { y: 0 }}
        transition={
          isAnimating
            ? {
                duration,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.2 }
        }
      >
        {children}
      </motion.div>

      {showPauseControl && !prefersReduced && (
        <button
          type="button"
          onClick={() => setPaused((prev) => !prev)}
          aria-pressed={paused}
          aria-label={
            paused ? "Resume mascot animation" : "Pause mascot animation"
          }
          title={paused ? "Resume animation" : "Pause animation"}
          className="mt-1.5 inline-flex h-[24px] items-center gap-1 rounded-full border border-[#DFD6F2] bg-white/90 px-2.5 text-[10px] font-semibold text-[#5A468C] transition-[background-color,color] duration-150 hover:bg-[#F2ECFF] hover:text-[#351080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#351080]"
        >
          {paused ? (
            <Play size={9} fill="currentColor" aria-hidden="true" />
          ) : (
            <Pause size={9} fill="currentColor" aria-hidden="true" />
          )}
          <span>{paused ? "Play motion" : "Pause motion"}</span>
        </button>
      )}
    </div>
  );
}

/** Smooth count-up number with tabular-nums so digits never jitter horizontally. */
export function AnimatedCounter({
  value,
  duration = 0.7,
  formatter,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState<number>(value);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(display, value, {
      duration,
      ease: EYVA_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, prefersReduced]);

  const formatted = formatter ? formatter(display) : String(display);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
