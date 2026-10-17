// ai-review.js
// Sends the latest commit's diff to a local Ollama model and saves its review.
// Advisory only: it always exits 0, so it can never break the build.
const { execFileSync } = require('child_process');
const fs = require('fs');

const MODEL = process.env.AI_MODEL || 'qwen2.5-coder:3b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MAX_DIFF_CHARS = 6000;

const OUTPUT_FILE = 'ai-review.md';

function getGitDiff() {
    try {
        return execFileSync('git', ['diff', 'HEAD~1', 'HEAD', '--', '*.js', '*.html'],
            { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    } catch (error) {
        console.error('Error occurred while fetching git diff:', error);
        return '';
    }
}

async function main() {
    let diff = getGitDiff();
    if (!diff.trim()) {
        fs.writeFileSync(OUTPUT_FILE, 'No changes detected in the latest commit.');
        console.log('No changes detected in the latest commit.');
        return;
    }

    let truncated = false;
    if (diff.length > MAX_DIFF_CHARS) {
        diff = diff.slice(0, MAX_DIFF_CHARS);
        truncated = true;
    }
    const prompt = `You are a code reviewer. Review ONLY the changes in this git diff.
List at most 3 findings: potential bugs, security risks, or missing test cases.
Be specific and refer to the changed lines. If you see no real problem, say "No issues found."
Then suggest ONE Playwright test (JavaScript) that would cover the change.

    DIFF:
    ${diff}`;

const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.2, num_ctx: 4096 },
    }),
    signal: AbortSignal.timeout(240000), // 4 min: the first call loads the model
  });


const data = await response.json();

  const output = [
    '# AI review (experimental, unverified)',
    '',
    `Model: ${MODEL}`,
    truncated ? '\n> Diff was truncated to fit the model context.\n' : '',
    data.response,
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Review written to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('AI review skipped:', err.message);
  fs.writeFileSync(OUTPUT_FILE, `# AI review\n\nSkipped: ${err.message}\n`);
});
