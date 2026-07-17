export type RoiInputs = {
  annualRevenue: number;
  annualPayroll: number;
  employees: number;
  keySalary: number;
  engagedPct: number;
  productivityDrag: number;
  extraDays: number;
  replacementPct: number;
  monthlyCost: number;
  improvementPct: number;
};

export type RoiResults = {
  annualRevenue: number;
  annualPayroll: number;
  employees: number;
  keySalary: number;
  monthlyCost: number;
  engagedPct: number;
  productivityDrag: number;
  extraDays: number;
  replacementPct: number;
  improvementPct: number;
  avgHourlyRate: number;
  annualHours: number;
  notEngagedPct: number;
  disengagedHours: number;
  lostHours: number;
  productivityCost: number;
  absenteeHours: number;
  absenteeCost: number;
  turnoverCost: number;
  totalCultureCost: number;
  fteEquivalent: number;
  annualCost: number;
  annualCostPctOfRevenue: number;
  breakEvenNeeded: number;
  recoveredValue: number;
  netGain: number;
  productivityShare: number;
  absenteeShare: number;
  turnoverShare: number;
  maxRecoveryScale: number;
};

export const defaultRoiInputs: RoiInputs = {
  annualRevenue: 5000000,
  annualPayroll: 2500000,
  employees: 50,
  keySalary: 200000,
  engagedPct: 35,
  productivityDrag: 15,
  extraDays: 3,
  replacementPct: 50,
  monthlyCost: 500,
  improvementPct: 5,
};

export function calculateRoi(inputs: RoiInputs): RoiResults {
  const annualRevenue = inputs.annualRevenue || 0;
  const annualPayroll = inputs.annualPayroll || 0;
  const employees = Math.max(1, inputs.employees || 1);
  const keySalary = inputs.keySalary || 0;
  const engagedPct = (inputs.engagedPct || 0) / 100;
  const productivityDrag = (inputs.productivityDrag || 0) / 100;
  const extraDays = inputs.extraDays || 0;
  const replacementPct = (inputs.replacementPct || 0) / 100;
  const monthlyCost = inputs.monthlyCost || 0;
  const improvementPct = (inputs.improvementPct || 0) / 100;

  const avgHourlyRate = annualPayroll / employees / 2080;
  const annualHours = employees * 2080;
  const notEngagedPct = 1 - engagedPct;
  const disengagedHours = annualHours * notEngagedPct;
  const lostHours = disengagedHours * productivityDrag;
  const productivityCost = lostHours * avgHourlyRate;
  const absenteeHours = extraDays * employees * 8;
  const absenteeCost = absenteeHours * avgHourlyRate;
  const turnoverCost = keySalary * replacementPct;
  const totalCultureCost = productivityCost + absenteeCost + turnoverCost;
  const fteEquivalent = avgHourlyRate > 0 ? totalCultureCost / avgHourlyRate / 2080 : 0;
  const annualCost = monthlyCost * 12;
  const annualCostPctOfRevenue = annualRevenue > 0 ? annualCost / annualRevenue : 0;
  const breakEvenNeeded = totalCultureCost > 0 ? annualCost / totalCultureCost : 0;
  const recoveredValue = totalCultureCost * improvementPct;
  const netGain = recoveredValue - annualCost;

  const total = totalCultureCost || 1;
  const productivityShare = productivityCost / total;
  const absenteeShare = absenteeCost / total;
  const turnoverShare = turnoverCost / total;
  const maxRecoveryScale = Math.max(totalCultureCost, recoveredValue, annualCost, 1);

  return {
    annualRevenue,
    annualPayroll,
    employees,
    keySalary,
    monthlyCost,
    engagedPct,
    productivityDrag,
    extraDays,
    replacementPct,
    improvementPct,
    avgHourlyRate,
    annualHours,
    notEngagedPct,
    disengagedHours,
    lostHours,
    productivityCost,
    absenteeHours,
    absenteeCost,
    turnoverCost,
    totalCultureCost,
    fteEquivalent,
    annualCost,
    annualCostPctOfRevenue,
    breakEvenNeeded,
    recoveredValue,
    netGain,
    productivityShare,
    absenteeShare,
    turnoverShare,
    maxRecoveryScale,
  };
}

export function clampWidth(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number, digits = 0) {
  return `${((Number.isFinite(value) ? value : 0) * 100).toFixed(digits)}%`;
}
