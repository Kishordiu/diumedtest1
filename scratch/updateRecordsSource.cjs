const fs = require('fs');
let code = fs.readFileSync('src/features/records/RecordsPage.tsx', 'utf8');

code = code.replace(
  "{(m.metadata as any)?.source === 'camera_contact_ppg' ? 'Pulse Touch' : 'Bio-Aura'}",
  "{(m.metadata as any)?.source === 'camera_contact_ppg' ? 'Pulse Touch' : (m.metadata as any)?.source === 'lab_report' ? 'Lab Report' : (m.metadata as any)?.source === 'camera_colorimetry' ? 'Vision AI' : 'Bio-Aura'}"
);

fs.writeFileSync('src/features/records/RecordsPage.tsx', code);
console.log('done');
