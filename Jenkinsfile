
pipeline {
    agent any

    stages {
        stage('Install Frontend') {
            steps {
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

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                bat 'docker compose up -d'
            }
        }
    }

    post {
        success {
            echo 'StockShare CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'StockShare CI/CD pipeline failed.'
        }
    }
}
