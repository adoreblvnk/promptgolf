"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const frames = [
  {
    title: "Drafting grid",
    body: "The task starts as a public brief: enough to build something plausible, not enough to survive product reality.",
    image: "/images/blueprint-sequence/01-drafting-grid.webp",
  },
  {
    title: "Specification unfolds",
    body: "A stronger prompt turns the brief into operating rules, assumptions, acceptance criteria, and edge cases.",
    image: "/images/blueprint-sequence/02-specification-unfolds.webp",
  },
  {
    title: "Artifact assembles",
    body: "The same builder receives the human spec and produces a checkout app. The model is held constant.",
    image: "/images/blueprint-sequence/03-artifact-assembles.webp",
  },
  {
    title: "Evaluator attaches",
    body: "Stored EvalSpecs materialize as Playwright behavior checks. The score follows observable capability evidence.",
    image: "/images/blueprint-sequence/04-evaluator-attaches.webp",
  },
  {
    title: "Hidden checks reveal",
    body: "Cents math, promo normalization, stock boundaries, double-submit safety, and mobile usability separate the field.",
    image: "/images/blueprint-sequence/05-hidden-checks-reveal.webp",
  },
  {
    title: "Score locks",
    body: "Prompt diagnosis happens after scoring. It explains the gap; it never rewrites the generated result.",
    image: "/images/blueprint-sequence/06-score-lock.webp",
  },
] as const;

export function LandingScrollNarrative() {
  const containerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const traceLength = useTransform(scrollYProgress, [0.08, 0.92], [0.05, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["2%", "-3%"]);

  if (reduceMotion) {
    return (
      <section className="landing-band" aria-labelledby="blueprint-static-title">
        <div className="landing-shell grid gap-8 py-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <h2 id="blueprint-static-title" className="landing-h2">
              A benchmark rig for agentic specs.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
              PromptGolf holds the builder constant, evaluates generated behavior, and uses hidden tests to reveal product knowledge.
            </p>
          </div>
          <div className="blueprint-frame aspect-[16/9]">
            <Image
              src="/images/blueprint-sequence/06-score-lock.webp"
              alt="Technical blueprint illustration of PromptGolf's generated artifact, evaluator, hidden checks, and score target aligned."
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="relative min-h-[620vh]" aria-labelledby="blueprint-scroll-title">
      <div className="sticky top-[52px] min-h-[calc(100dvh-52px)] overflow-hidden">
        <div className="landing-shell grid min-h-[calc(100dvh-52px)] gap-8 py-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-center lg:py-10">
          <div className="relative z-10 max-w-xl">
            <p className="landing-kicker">Scroll rig / same builder</p>
            <h2 id="blueprint-scroll-title" className="landing-h2 mt-4">
              Watch a prompt become an evaluated system.
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-soft">
              The page art is schematic, but the product claim is literal: same task, same OpenAI builder path, same stored checks, different human specification.
            </p>

            <div className="mt-8 hidden space-y-3 lg:block" aria-label="Blueprint narrative stages">
              {frames.map((frame, index) => (
                <StageRow key={frame.title} frame={frame} index={index} progress={scrollYProgress} />
              ))}
            </div>
          </div>

          <motion.div style={{ y }} className="relative min-h-[48vh] lg:min-h-[72vh]">
            <div className="blueprint-frame absolute inset-0">
              {frames.map((frame, index) => (
                <FrameLayer key={frame.image} frame={frame} index={index} progress={scrollYProgress} />
              ))}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 60" aria-hidden="true">
                <motion.path
                  d="M16 45 C 30 28, 45 36, 57 22 S 78 18, 86 9"
                  pathLength={traceLength}
                  fill="none"
                  stroke="oklch(0.72 0.16 58 / 0.8)"
                  strokeWidth="0.22"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="absolute inset-x-3 bottom-3 border border-rule bg-paper/90 px-3 py-2 font-mono text-[10px] text-ink-soft lg:hidden">
              Spec → artifact → evaluator → hidden checks → score
            </div>
            <div className="absolute bottom-4 right-4 hidden border border-rule bg-paper/80 px-3 py-2 font-mono text-[11px] text-ink-soft lg:block">
              Playwright behavior / hidden checks / score lock
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StageRow({
  frame,
  index,
  progress,
}: {
  frame: (typeof frames)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = index / frames.length;
  const mid = (index + 0.5) / frames.length;
  const end = (index + 1) / frames.length;
  const opacity = useTransform(progress, [start, mid, end], [0.45, 1, 0.45]);
  const x = useTransform(progress, [start, mid, end], [-8, 0, -8]);

  return (
    <motion.div style={{ opacity, x }} className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-rule py-3">
      <span className="font-mono text-xs tabular-nums text-accent">{String(index + 1).padStart(2, "0")}</span>
      <span>
        <span className="block text-sm font-semibold text-ink">{frame.title}</span>
        <span className="mt-1 block text-sm leading-6 text-ink-soft">{frame.body}</span>
      </span>
    </motion.div>
  );
}

function FrameLayer({
  frame,
  index,
  progress,
}: {
  frame: (typeof frames)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const center = index / (frames.length - 1);
  const inputRange =
    index === 0
      ? [0, 0.13]
      : index === frames.length - 1
        ? [0.87, 1]
        : [center - 0.13, center, center + 0.13];
  const outputRange = index === 0 ? [1, 0] : index === frames.length - 1 ? [0, 1] : [0, 1, 0];
  const opacity = useTransform(progress, inputRange, outputRange);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <Image
        src={frame.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 68vw, 100vw"
        className="object-cover"
        priority={index === 0}
      />
    </motion.div>
  );
}

export function BlueprintDetailImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn("blueprint-frame aspect-[3/2]", className)}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 31vw, 100vw" className="object-cover" />
    </div>
  );
}
