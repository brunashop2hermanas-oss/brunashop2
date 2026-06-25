const fs = require('fs');

function autoApply() {
  const chunks = JSON.parse(fs.readFileSync('C:\\Users\\abrah\\Desktop\\sistema_BrunaShop2\\chunks_54.json', 'utf8'));
  let content = fs.readFileSync('C:\\Users\\abrah\\Desktop\\sistema_BrunaShop2\\src\\app\\admin\\productos\\page.tsx', 'utf8');

  for (const call of chunks) {
    if (!call.TargetFile.includes('admin\\\\productos\\\\page.tsx')) {
      continue;
    }
    
    if (call.ReplacementChunks) {
      let parsedChunks; try { parsedChunks = typeof call.ReplacementChunks === "string" ? JSON.parse(call.ReplacementChunks) : call.ReplacementChunks; } catch(e) { console.log("Skipping due to truncation: " + call.Description); continue; }
      for (const chunk of parsedChunks) {
        if (chunk.TargetContent) {
          content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
        }
      }
    } else if (call.ReplacementContent && call.TargetContent) {
      let target = typeof call.TargetContent === 'string' ? call.TargetContent : call.TargetContent.toString();
      let repl = typeof call.ReplacementContent === 'string' ? call.ReplacementContent : call.ReplacementContent.toString();
      
      content = content.replace(target, repl);
    }
  }

  fs.writeFileSync('C:\\Users\\abrah\\Desktop\\sistema_BrunaShop2\\src\\app\\admin\\productos\\page.tsx', content);
}

autoApply();
