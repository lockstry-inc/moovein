export const FEATURE_ICONS: Record<string, string> = {
  climate: '\u2744\uFE0F',
  driveup: '\uD83D\uDE97',
  ext: '\uD83C\uDFE0',
  smartlock: '\uD83D\uDD12',
  power: '\u26A1',
  alarm: '\uD83D\uDEA8',
  standard: '\uD83D\uDEAA',
}

export const FEATURE_LABELS: Record<string, string> = {
  climate: 'Climate Control',
  driveup: 'Drive-up',
  ext: 'Exterior',
  smartlock: 'Smart Lock',
  power: 'Power Outlet',
  alarm: 'Unit Alarm',
  standard: 'Standard',
}

export function getUnitFeatureList(unit: { climate?: number; driveup?: number; ext?: number; smartlock?: number; power?: number; alarm?: number }) {
  const feats: { key: string; icon: string; label: string }[] = []
  if (unit.climate) feats.push({ key: 'climate', icon: FEATURE_ICONS.climate, label: FEATURE_LABELS.climate })
  if (unit.driveup) feats.push({ key: 'driveup', icon: FEATURE_ICONS.driveup, label: FEATURE_LABELS.driveup })
  if (unit.ext) feats.push({ key: 'ext', icon: FEATURE_ICONS.ext, label: FEATURE_LABELS.ext })
  if (unit.smartlock) feats.push({ key: 'smartlock', icon: FEATURE_ICONS.smartlock, label: FEATURE_LABELS.smartlock })
  if (unit.power) feats.push({ key: 'power', icon: FEATURE_ICONS.power, label: FEATURE_LABELS.power })
  if (unit.alarm) feats.push({ key: 'alarm', icon: FEATURE_ICONS.alarm, label: FEATURE_LABELS.alarm })
  if (feats.length === 0) feats.push({ key: 'standard', icon: FEATURE_ICONS.standard, label: FEATURE_LABELS.standard })
  return feats
}
