/**
 * Attendance planning from RSVP counts. Published RSVP-attrition figures are
 * mostly from Western weddings, so every probability here is an editable
 * assumption (docs/BENCHMARKS.md), calibrated from the organiser's own earlier
 * functions where possible. The numbers are planning heuristics, not predictions.
 */
export interface RsvpCounts {
  /** Party-size-weighted counts. */
  yes: number;
  maybe: number;
  pending: number;
  declined: number;
}

export interface AttendanceAssumptions {
  /** Share of "maybe" guests who turn up. */
  pMaybe: number;
  /** Share of guests who have not replied who turn up. */
  pPending: number;
  /** Extra plates ordered above the expected figure, e.g. 0.05 for 5%. */
  bufferPct: number;
}

export const DEFAULT_ATTENDANCE: Readonly<AttendanceAssumptions> = {
  pMaybe: 0.5,
  pPending: 0.8,
  bufferPct: 0.05,
};

export interface AttendanceEstimate {
  low: number;
  likely: number;
  /** Everyone who has not declined. */
  high: number;
  /** Likely + buffer, rounded up: the figure to give a caterer. */
  cateringHeadcount: number;
}

export function estimateAttendance(
  counts: RsvpCounts,
  assumptions: AttendanceAssumptions = DEFAULT_ATTENDANCE,
): AttendanceEstimate {
  const uncertain = counts.maybe * assumptions.pMaybe + counts.pending * assumptions.pPending;
  const likely = Math.round(counts.yes + uncertain);
  return {
    low: Math.round(counts.yes + uncertain * 0.5),
    likely,
    high: counts.yes + counts.maybe + counts.pending,
    cateringHeadcount: Math.ceil(likely * (1 + assumptions.bufferPct)),
  };
}

/**
 * After a function is over, compare reality with the plan and nudge the
 * pending-guest probability for later functions (bounded so one odd night cannot
 * wreck the next plan).
 */
export function calibratePending(
  assumptions: AttendanceAssumptions,
  planned: number,
  actual: number,
): AttendanceAssumptions {
  if (planned <= 0) return assumptions;
  const ratio = Math.min(1.25, Math.max(0.75, actual / planned));
  return { ...assumptions, pPending: Math.min(1, Math.round(assumptions.pPending * ratio * 100) / 100) };
}
