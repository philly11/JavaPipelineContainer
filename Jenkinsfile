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

        stage('Run tests and report') {
            steps {
                bat 'npm run test:report'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        }
    }
}
