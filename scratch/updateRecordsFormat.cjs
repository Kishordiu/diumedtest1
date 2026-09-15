const fs = require('fs');
let code = fs.readFileSync('src/features/records/RecordsPage.tsx', 'utf8');

code = code.replace(
  "return labels[type] ?? type",
  "return labels[type] ?? type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')"
);

fs.writeFileSync('src/features/records/RecordsPage.tsx', code);
console.log('done');
