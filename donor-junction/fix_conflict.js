const fs = require('fs');
const file = 'd:\\xampp\\htdocs\\Donor-junction-app\\donor-junction\\src\\screens\\settings\\SettingsScreen.js';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Delete lines 245 through 359 (inclusive, 0-indexed: indices 244 to 358)
lines.splice(244, 359 - 245 + 1);

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed SettingsScreen.js lines 245-359');
