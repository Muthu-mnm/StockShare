pipeline {
    agent any

    stages{
        stage('Checkout') {
            step {
                checkout scm
            }
        }

        stage('Install Frontend'){
            step {
                bat 'cd frontend && npm ci'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'cd frontend && npm run build'
            }
        }

        stage('Install Backend') {
            steps {
                bat 'cd backend && npm ci'
            }
        }
    }

    post {
        success {
            echo 'StockShare CI pipeline completed successfully'
        }

        failure {
            echo 'StockShare CI pipeline failed'
        }
    }
}