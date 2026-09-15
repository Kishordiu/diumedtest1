const fs = require('fs');

// 1. MeasurementResultPage.tsx
let mrp = fs.readFileSync('src/features/records/MeasurementResultPage.tsx', 'utf8');
mrp = mrp.replace(
  "await supabase.from('health_measurements').insert([{",
  "await supabase.from('health_measurements').insert({ // @ts-ignore\n"
);
mrp = mrp.replace(
  "} as any])",
  "} as any)"
);
fs.writeFileSync('src/features/records/MeasurementResultPage.tsx', mrp);

// 2. RecordDetailPage.tsx
let rdp = fs.readFileSync('src/features/records/RecordDetailPage.tsx', 'utf8');
// Convert value to string to avoid React complaining about unknown type
rdp = rdp.replace(
  "value: meta?.source ===",
  "value: (meta?.source === 'camera_contact_ppg' ? 'Pulse Touch (Finger Contact PPG)' : meta?.source === 'camera_rppg' ? 'Bio-Aura (Facial Remote rPPG)' : String(meta?.source ?? '?\"')) as string //"
);
rdp = rdp.replace(
  "value: meta?.algorithm_version as string ?? '?\"'",
  "value: String(meta?.algorithm_version ?? '?\"')"
);
fs.writeFileSync('src/features/records/RecordDetailPage.tsx', rdp);
console.log('done');
