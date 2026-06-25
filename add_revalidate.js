const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, 'src', 'app', 'actions');
const files = fs.readdirSync(actionsDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  if (!content.includes('import { revalidatePath')) {
    content = content.replace(/(['"]use server['"];?)/, `$1\nimport { revalidatePath } from "next/cache";`);
    modified = true;
  } else if (!content.includes('revalidatePath')) {
     content = content.replace(/(['"]use server['"];?)/, `$1\nimport { revalidatePath } from "next/cache";`);
     modified = true;
  }

  const regex = /return\s+\{\s*success:\s*true\b([^}]*)\}/g;
  content = content.replace(regex, (match) => {
    return `revalidatePath('/', 'layout');\n    ${match}`;
  });

  // Remove existing redundant revalidatePath calls if they are right before the new one
  content = content.replace(/revalidatePath\([^)]+\);\s*revalidatePath\('\/', 'layout'\);/g, `revalidatePath('/', 'layout');`);
  
  if (content !== fs.readFileSync(filePath, 'utf-8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
