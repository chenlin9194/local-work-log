import {
  PROJECT_MILESTONE_DATE_MODES,
  PROJECT_MILESTONE_STAGES,
  PROJECT_PLAN_TYPES,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const UNSET_MILESTONE_STAGE_KEY = "__unset";

export const PROJECT_MILESTONE_STAGE_VALUES: Set<string> = new Set(
  PROJECT_MILESTONE_STAGES.map((stage) => stage.value)
);

export const PROJECT_MILESTONE_DATE_MODE_VALUES: Set<string> = new Set(
  PROJECT_MILESTONE_DATE_MODES.map((mode) => mode.value)
);

export const PROJECT_PLAN_TYPE_VALUES: Set<string> = new Set(PROJECT_PLAN_TYPES.map((type) => type.value));

export const POINT_PLAN_TYPES = new Set(["milestone", "management"]);
export const RANGE_PLAN_TYPES = new Set(["requirement", "development", "test", "release"]);

export type MilestoneLike = {
  stage?: string | null;
  planType?: string | null;
  dateMode?: string | null;
  targetDate?: string | Date | null;
  actualDate?: string | Date | null;
  plannedStartDate?: string | Date | null;
  plannedEndDate?: string | Date | null;
  actualStartDate?: string | Date | null;
  actualEndDate?: string | Date | null;
  status?: string | null;
};

export type MilestoneScheduleCounts = {
  pointDelayed: number;
  rangeStartDelayed: number;
  rangeEndDelayed: number;
  onTime: number;
};

function toDateKey(value?: string | Date | null) {
  if (!value) return "";
  return formatDate(value, "iso");
}

export function compareDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function getDefaultDateMode(planType?: string | null) {
  return RANGE_PLAN_TYPES.has(planType || "") ? "range" : "point";
}

export function normalizePlanType(value: unknown) {
  if (typeof value !== "string") return "milestone";

  const planType = value.trim();
  return PROJECT_PLAN_TYPE_VALUES.has(planType) ? planType : "milestone";
}

export function normalizeDateMode(value: unknown, planType?: string | null) {
  if (planType && planType !== "other") {
    return getDefaultDateMode(planType);
  }

  if (typeof value === "string") {
    const dateMode = value.trim();
    if (PROJECT_MILESTONE_DATE_MODE_VALUES.has(dateMode)) return dateMode;
  }

  return getDefaultDateMode(planType);
}

export function normalizeStage(value: unknown) {
  if (typeof value !== "string") return "";

  const stage = value.trim();
  return PROJECT_MILESTONE_STAGE_VALUES.has(stage) ? stage : "";
}

export function getMilestoneStageKey(milestone: { stage?: string | null }) {
  return normalizeStage(milestone.stage) || UNSET_MILESTONE_STAGE_KEY;
}

export function getMilestoneDateMode(milestone: { dateMode?: string | null; planType?: string | null }) {
  return normalizeDateMode(milestone.dateMode, milestone.planType);
}

export function isRangePlan(milestone: { dateMode?: string | null; planType?: string | null }) {
  const planType = normalizePlanType(milestone.planType);
  return RANGE_PLAN_TYPES.has(planType) || (planType === "other" && getMilestoneDateMode(milestone) === "range");
}

export function isPointMilestone(milestone: { dateMode?: string | null; planType?: string | null }) {
  return !isRangePlan(milestone);
}

export function getMilestonePlannedEnd(milestone: {
  plannedEndDate?: string | Date | null;
  targetDate?: string | Date | null;
}) {
  return milestone.plannedEndDate || milestone.targetDate || null;
}

export function getMilestoneActualEnd(milestone: {
  actualEndDate?: string | Date | null;
  actualDate?: string | Date | null;
}) {
  return milestone.actualEndDate || milestone.actualDate || null;
}

export function getPlannedPointDate(milestone: MilestoneLike) {
  return toDateKey(getMilestonePlannedEnd(milestone));
}

export function getActualPointDate(milestone: MilestoneLike) {
  return toDateKey(getMilestoneActualEnd(milestone));
}

export function getPlannedRange(milestone: MilestoneLike) {
  return {
    start: toDateKey(milestone.plannedStartDate),
    end: toDateKey(getMilestonePlannedEnd(milestone)),
  };
}

export function getActualRange(milestone: MilestoneLike) {
  return {
    start: toDateKey(milestone.actualStartDate),
    end: toDateKey(getMilestoneActualEnd(milestone)),
  };
}

export function hasScheduleDate(milestone: MilestoneLike) {
  if (isRangePlan(milestone)) {
    const plannedRange = getPlannedRange(milestone);
    return Boolean(plannedRange.start || plannedRange.end);
  }

  return Boolean(getPlannedPointDate(milestone));
}

export function isPointDelayed(milestone: MilestoneLike, today: string) {
  if (!isPointMilestone(milestone)) return false;

  const plannedDate = getPlannedPointDate(milestone);
  const actualDate = getActualPointDate(milestone);
  if (!plannedDate) return false;
  if (actualDate) return compareDateKeys(actualDate, plannedDate) > 0;
  return compareDateKeys(today, plannedDate) > 0 && milestone.status !== "done" && milestone.status !== "cancelled";
}

export function isRangeStartDelayed(milestone: MilestoneLike, today: string) {
  if (!isRangePlan(milestone)) return false;

  const plannedRange = getPlannedRange(milestone);
  const actualRange = getActualRange(milestone);
  if (!plannedRange.start) return false;
  if (actualRange.start) return compareDateKeys(actualRange.start, plannedRange.start) > 0;
  return compareDateKeys(today, plannedRange.start) > 0;
}

export function isRangeEndDelayed(milestone: MilestoneLike, today: string) {
  if (!isRangePlan(milestone)) return false;

  const plannedRange = getPlannedRange(milestone);
  const actualRange = getActualRange(milestone);
  if (!plannedRange.end) return false;
  if (actualRange.end) return compareDateKeys(actualRange.end, plannedRange.end) > 0;
  return compareDateKeys(today, plannedRange.end) > 0;
}

export function isScheduleOnTime(milestone: MilestoneLike, today: string) {
  if (!hasScheduleDate(milestone)) return false;
  return !isPointDelayed(milestone, today) && !isRangeStartDelayed(milestone, today) && !isRangeEndDelayed(milestone, today);
}

export function getScheduleSignalCounts(milestones: MilestoneLike[], today: string): MilestoneScheduleCounts {
  return milestones.reduce<MilestoneScheduleCounts>(
    (counts, milestone) => {
      const pointDelayed = isPointDelayed(milestone, today);
      const rangeStartDelayed = isRangeStartDelayed(milestone, today);
      const rangeEndDelayed = isRangeEndDelayed(milestone, today);

      return {
        pointDelayed: counts.pointDelayed + (pointDelayed ? 1 : 0),
        rangeStartDelayed: counts.rangeStartDelayed + (rangeStartDelayed ? 1 : 0),
        rangeEndDelayed: counts.rangeEndDelayed + (rangeEndDelayed ? 1 : 0),
        onTime: counts.onTime + (!pointDelayed && !rangeStartDelayed && !rangeEndDelayed && hasScheduleDate(milestone) ? 1 : 0),
      };
    },
    { pointDelayed: 0, rangeStartDelayed: 0, rangeEndDelayed: 0, onTime: 0 }
  );
}
