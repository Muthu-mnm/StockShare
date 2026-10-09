
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

        stage('Check Docker Compose') {
            steps {
                bat 'where docker'
                bat 'docker --version'
                bat 'docker compose version'
                bat 'docker-compose --version'
            }
        }
    }

    post {
        success {
            echo 'Docker Compose diagnostic completed successfully.'
        }

        failure {
            echo 'Docker Compose diagnostic failed. Check the Console Output.'
        }
    }
}
