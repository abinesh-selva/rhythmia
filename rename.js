const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('/var/www/html/own-project/rhythmia');

let count = 0;
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/Rhythmia/g, 'Vibeblower')
    .replace(/rhythmia/g, 'vibeblower')
    .replace(/RHYTHMIA/g, 'VIBEBLOWER');
    
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    count++;
    console.log('Updated', file);
  }
});

console.log(`Updated ${count} files.`);
