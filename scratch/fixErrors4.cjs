const fs = require('fs');

let rdp = fs.readFileSync('src/features/records/RecordDetailPage.tsx', 'utf8');
rdp = rdp.replace(
  "] as Array<{label: string, value: string, valueClass?: string}>).map(({ label, value, valueClass }) => (",
  "] as {label: string, value: string, valueClass?: string}[]).map(({ label, value, valueClass }) => ("
);
fs.writeFileSync('src/features/records/RecordDetailPage.tsx', rdp);
console.log('done');
