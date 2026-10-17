pipeline {
    agent any

    environment {
        SKIP_DB_TESTS = 'true'
    }

    stages {
        stage('Install dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Install Playwright browser') {
            steps {
                // Chromium only: saves download time, disk and RAM
                bat 'npx playwright install chromium'
            }
        }

        stage('Run tests') {
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    bat 'npx playwright test --project=chromium'
                }
            }
        }

        stage('AI review (experimental)') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    timeout(time: 5, unit: 'MINUTES') {
                        bat 'node ai-review.js'
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**, ai-review.md', allowEmptyArchive: true
        }
    }
}