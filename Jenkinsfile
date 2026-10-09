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

        stage('Build Docker Images') {
            steps {
                bat '"C:/Users/MUTHUKUMAR B/AppData/Local/Programs/DockerDesktop/resources/bin/docker-compose.exe" build'
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                bat '"C:/Users/MUTHUKUMAR B/AppData/Local/Programs/DockerDesktop/resources/bin/docker-compose.exe" up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                bat '"C:/Users/MUTHUKUMAR B/AppData/Local/Programs/DockerDesktop/resources/bin/docker-compose.exe" ps'
            }
        }
    }

    post {
        success {
            echo 'StockShare CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'StockShare CI/CD pipeline failed. Check the Console Output.'
        }
    }
}