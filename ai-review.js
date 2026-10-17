// ai-review.js
// Sends the latest commit's code diff to a local Ollama model and saves
// a review (bugs, security risks, missing test scenarios) to ai-review.md.
// Advisory only: it always exits 0, so it can never break the build.
const { execFileSync } = require('child_process');
const fs = require('fs');

const MODEL = process.env.AI_MODEL || 'qwen2.5-coder:3b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OUTPUT_FILE = 'ai-review.md';

// Keep the prompt small: local models have small context windows.
const MAX_DIFF_CHARS = 6000;
const MAX_CONTEXT_CHARS = 2000; // per context file
const MAX_TEST_CHARS = 2500;

// Reference material the model may read but should not review.
const CONTEXT_FILES = ['public/index.html', 'public/login.js'];
const EXISTING_TESTS = ['tests/login.spec.js'];

function getDiff() {
  try {
    return execFileSync(
      'git',
      [
        'diff', 'HEAD~1', 'HEAD', '--',
        '*.js', '*.html', '*.sql',
        // Do not review the review tool, the tests, or config files
        ':(exclude)ai-review.js',
        ':(exclude)tests/*',
        ':(exclude)playwright.config.js',
      ],
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch {
    return ''; // e.g. first commit, so no HEAD~1
  }
}

function readFiles(files, maxChars) {
  return files
    .filter((f) => fs.existsSync(f))
    .map((f) => `--- ${f} ---\n${fs.readFileSync(f, 'utf-8').slice(0, maxChars)}`)
    .join('\n\n');
}

function buildPrompt(diff) {
  return `You are a QA engineer reviewing a code change.

CHANGED CODE (the diff):
${diff}

EXISTING TESTS (already written, do not repeat these):
${readFiles(EXISTING_TESTS, MAX_TEST_CHARS)}

PAGE CONTEXT (reference only, do not review):
${readFiles(CONTEXT_FILES, MAX_CONTEXT_CHARS)}

Tasks:
1. List up to 3 bugs or security risks in the CHANGED CODE. If there are none, write "No issues found."
2. List up to 5 test scenarios that the CHANGED CODE needs but EXISTING TESTS do not cover.
   Give each one a one-line description only (no code). Think about: invalid input,
   empty fields, duplicate data, error responses, and security cases.`;
}

async function main() {
  let diff = getDiff();

  if (!diff.trim()) {
    fs.writeFileSync(
      OUTPUT_FILE,
      '# AI review\n\nNo application code changes in the latest commit.\n'
    );
    console.log('No application code changes to review.');
    return;
  }

  let truncated = false;
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS);
    truncated = true;
  }

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: buildPrompt(diff),
      stream: false,
      options: { temperature: 0.2, num_ctx: 6144 },
    }),
    signal: AbortSignal.timeout(240000), // 4 min: the first call loads the model
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

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
  // No process.exit(1): this stage is advisory and must never fail the build.
});