// report-results.js
// Parses Playwright's JSON report and inserts each test result into SQL Server.

require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { sql, getPool } = require('./db');

const RESULTS_FILE = 'test-results/results.json';

//recursively walk nested suites to find every test case 
function collectSpecs(suites, acc = []) {
    for (const suite of suites) {
        if (suite.specs) acc.push(...suite.specs);
        if (suite.suites) collectSpecs(suite.suites, acc);
    }
    return acc;
}

async function main() {
    const raw = fs.readFileSync(RESULTS_FILE, 'utf-8');
    const report = JSON.parse(raw);


    const specs = collectSpecs(report.suites);
    const runId = crypto.randomUUID(); // Generate a unique run ID for this test run

    const pool = await getPool();
    let inserted = 0;

    for (const spec of specs) {
        for (const test of spec.tests || []) {
            const browser = test.projectName || 'unknown';
            const result = test.results?.[0] // first attempt
            if (!result) continue;

            const status = result.status;
            const durationMs = result.duration ?? null; 

              await pool.request()
        .input('runId', sql.NVarChar, runId)
        .input('testName', sql.NVarChar, spec.title)
        .input('browser', sql.NVarChar, browser)
        .input('status', sql.NVarChar, status)
        .input('durationMs', sql.Int, durationMs)
        .query(`
          INSERT INTO dbo.TestRuns (RunId, TestName, Browser, Status, DurationMs)
          VALUES (@runId, @testName, @browser, @status, @durationMs)
        `);

        inserted++;
        }
    }

    console.log(`Inserted ${inserted} test results (runId: ${runId})`);
    await pool.close();
}
main().catch(err => {
    console.error('Error inserting test results:', err);
    process.exit(1);
});
        