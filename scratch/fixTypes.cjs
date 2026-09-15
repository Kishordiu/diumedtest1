const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  code = code.replace(
    "import { analyzeROI, ColorimetryResult } from './ColorimetryEngine'",
    "import { analyzeROI, type ColorimetryResult } from './ColorimetryEngine'"
  );

  code = code.replace(
    "} as any])",
    "}] as any)"
  );
  
  fs.writeFileSync(file, code);
}

fix('src/features/vision/AnemiaScreeningPage.tsx');
fix('src/features/vision/ScleraScreeningPage.tsx');
console.log('done');
