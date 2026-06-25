const fs = require('fs');
const readline = require('readline');

async function recover() {
  const fileStream = fs.createReadStream('C:\\Users\\abrah\\.gemini\\antigravity-ide\\brain\\da81af54-7c1c-40de-bb99-276c7e6d28e3\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let chunks = [];

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
        for (const call of data.tool_calls) {
          if ((call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') && call.args ) {
            call.args.step_index = data.step_index; chunks.push(call.args);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  fs.writeFileSync('C:\\Users\\abrah\\Desktop\\sistema_BrunaShop2\\recovered_chunks.json', JSON.stringify(chunks, null, 2));
}

recover();
