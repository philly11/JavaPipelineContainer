pipeline {
    agent any

    environment {
        // Define environment variables here if needed
        DB_SERVER = 'localhost'
        DB_DATABASE = 'JavaPipelineDB'
        DB_USER = 'app_user'
        DB_PASSWORD = credentials('db-password') // Use Jenkins credentials for sensitive data
        DB_PORT = '1433'
        DB_ENCRYPT = 'false'
        DB_TRUST_SERVER_CERTIFICATE = 'true'
        PORT = '8888'
    }

    stages {
        stage('Install dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Install Playwright browsers') {
            steps {
                bat 'npx playwright install'
            }
        }

        stage('Run tests') {
            steps {
                //tests fail, build is marked as unstable
                catchError(buildResult: 'UNSTABLE', stageResult: 'Failure') {
                    bat 'npx playwright test'
                }
            }
        }

        stage('Generate Test Report') {
            steps {
                bat 'node report-results.js'
            }
        }
    

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        }
    }
}
}
