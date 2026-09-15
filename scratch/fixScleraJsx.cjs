const fs = require('fs');
let code = fs.readFileSync('src/features/vision/ScleraScreeningPage.tsx', 'utf8');

code = code.replace(
  "Elevated yellowness (b* > 5.0)",
  "Elevated yellowness (b* &gt; 5.0)"
);

fs.writeFileSync('src/features/vision/ScleraScreeningPage.tsx', code);
console.log('done');
