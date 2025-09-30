#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src'];
const filelist = [];
for (const root of roots) walk(root);

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx?|css|md|ts)$/.test(name)) filelist.push(p);
  }
}

const disallowed = [
  /#[0-9a-fA-F]{3,6}\b(?!\])/m, // raw hex
  /rgba?\(/m, // raw rgb(a)
];

const iconPacks = [/@mui\/icons-material/, /react-icons/, /heroicons?/, /material-icons?/];

let errors = 0;
for (const file of filelist) {
  const txt = readFileSync(file, 'utf8');
  if (file.includes('styles/tokens.css')) continue; // tokens file can define base colors
  for (const pat of disallowed) {
    if (pat.test(txt)) {
      console.error(`Disallowed color in ${file}`);
      errors++;
      break;
    }
  }
  if (/package\.json$/.test(file)) continue;
  for (const ic of iconPacks) {
    if (ic.test(txt)) {
      console.error(`Disallowed icon pack in ${file}: ${ic}`);
      errors++;
      break;
    }
  }
}

if (errors) {
  console.error(`Design check failed with ${errors} issue(s).`);
  process.exit(1);
} else {
  console.log('Design check passed.');
}

