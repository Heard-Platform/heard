import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import "./NappingCat.css";

const CAT_WIDTH_PX = 66;
const START_X_PX = -140;
const ENTER_DELAY_MS = 1200;
const WALK_MS = 3200;
const SETTLE_MS = 500;
const Z_DELAYS_S = [0, 0.7, 1.4];

type Pose = "hidden" | "walking" | "standing" | "sleeping";

/** A cat that walks in from the left and naps on top of whatever it's placed above. Sits on its parent's top edge. */
export function NappingCat() {
  const stageRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [pose, setPose] = useState<Pose>("hidden");

  useEffect(() => {
    const stage = stageRef.current;
    const cat = catRef.current;
    if (!stage || !cat) return;

    const restX = stage.offsetWidth / 2 - CAT_WIDTH_PX / 2;
    if (prefersReducedMotion) {
      cat.style.transform = `translateX(${restX}px)`;
      setPose("sleeping");
      return;
    }

    let isCancelled = false;
    let walk: ReturnType<typeof animate> | undefined;
    const timers: number[] = [];
    const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    after(ENTER_DELAY_MS, () => {
      setPose("walking");
      walk = animate(cat, { x: [START_X_PX, restX] }, { duration: WALK_MS / 1000, ease: "linear" });
      walk.then(() => {
        if (isCancelled) return;
        setPose("standing");
        after(SETTLE_MS, () => setPose("sleeping"));
      });
    });

    return () => {
      isCancelled = true;
      walk?.stop();
      timers.forEach(window.clearTimeout);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[calc(100%-3px)] left-0 h-0 w-full"
    >
      <div
        ref={catRef}
        className={`napping-cat is-${pose} absolute bottom-0 left-0`}
        style={{ transform: `translateX(${START_X_PX}px)` }}
      >
        <CatSvg />
        {Z_DELAYS_S.map((delayS, index) => (
          <span key={index} className="cat-z" style={{ left: 44 + index * 8, animationDelay: `${delayS}s` }}>
            {index === Z_DELAYS_S.length - 1 ? "Z" : "z"}
          </span>
        ))}
      </div>
    </div>
  );
}

function CatSvg() {
  return (
    <svg viewBox="0 0 90 60">
      <g className="cat-body cat-fill">
        <path className="cat-tail" d="M20 34 C 8 30, 6 18, 12 10" />
        <rect className="cat-leg cat-leg-a" x="22" y="38" width="6" height="18" rx="3" />
        <rect className="cat-leg cat-leg-b" x="30" y="38" width="6" height="18" rx="3" />
        <rect className="cat-leg cat-leg-b" x="50" y="38" width="6" height="18" rx="3" />
        <ellipse className="cat-torso" cx="42" cy="36" rx="24" ry="11" />
        <g className="cat-head">
          <circle cx="68" cy="26" r="11" />
          <path d="M59 21 L60 8 L68 16 Z" />
          <path d="M70 16 L78 8 L77 21 Z" />
          <g className="cat-eyes-open">
            <ellipse cx="66" cy="25" rx="1.8" ry="2.4" />
            <ellipse cx="73" cy="25" rx="1.8" ry="2.4" />
          </g>
          <g className="cat-eyes-closed">
            <path d="M64 26 q2 1.6 4 0 M71 26 q2 1.6 4 0" />
          </g>
        </g>
        <rect className="cat-leg cat-leg-a" x="58" y="38" width="6" height="18" rx="3" />
      </g>
    </svg>
  );
}
