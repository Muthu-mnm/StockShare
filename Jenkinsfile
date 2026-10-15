pipeline {
    agent any

    environment {
        // Configurable compose binary with fallback to the Windows Docker Desktop location
        COMPOSE_BIN = "${env.DOCKER_COMPOSE_BIN ?: 'C:/Users/MUTHUKUMAR B/AppData/Local/Programs/DockerDesktop/resources/bin/docker-compose.exe'}"
        // Consistent project name across CI/CD and manual executions to prevent port collisions
        COMPOSE_PROJECT_NAME = 'stockshare'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source repository...'
                checkout scm
            }
        }

        stage('Frontend Checks') {
            steps {
                echo 'Installing frontend dependencies, running lint, and building production bundle...'
                bat 'cd frontend && npm ci'
                bat 'cd frontend && npm run lint'
                bat 'cd frontend && npm run build'
            }
        }

        stage('Backend Checks') {
            steps {
                echo 'Installing backend dependencies and executing integration tests...'
                bat 'cd backend && npm ci'
                bat 'cd backend && npm test'
            }
        }

        stage('Docker Compose Validation') {
            steps {
                echo 'Validating Docker Compose configuration syntax and volume mapping...'
                bat "\"${COMPOSE_BIN}\" -p ${COMPOSE_PROJECT_NAME} config"
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building container images for frontend and backend...'
                bat "\"${COMPOSE_BIN}\" -p ${COMPOSE_PROJECT_NAME} build"
            }
        }

        stage('Deploy Full Stack') {
            steps {
                echo 'Deploying application, Prometheus, and Grafana containers...'
                bat "\"${COMPOSE_BIN}\" -p ${COMPOSE_PROJECT_NAME} up -d --remove-orphans"
            }
        }

        stage('Verify Health & Observability') {
            steps {
                echo 'Verifying container status and service health endpoints...'
                bat """
                powershell -Command "
                    Write-Host '--- Checking Container Status ---'
                    & '${COMPOSE_BIN}' -p '${COMPOSE_PROJECT_NAME}' ps

                    Write-Host '--- Waiting for Backend Healthcheck (http://localhost:5000/health) ---'
                    \$attempts = 0
                    \$maxAttempts = 12
                    \$backendOk = \$false

                    while (\$attempts -lt \$maxAttempts) {
                        Start-Sleep -Seconds 5
                        \$attempts++
                        try {
                            \$resp = Invoke-RestMethod -Uri 'http://localhost:5000/health' -TimeoutSec 3 -ErrorAction Stop
                            if (\$resp.status -eq 'healthy') {
                                Write-Host ('[SUCCESS] Backend health check passed on attempt ' + \$attempts)
                                \$backendOk = \$true
                                break
                            }
                        } catch {
                            Write-Host ('[INFO] Attempt ' + \$attempts + '/' + \$maxAttempts + ': waiting for backend...')
                        }
                    }

                    if (-not \$backendOk) {
                        Write-Error '[ERROR] Backend failed to report healthy status within timeout.'
                        exit 1
                    }

                    Write-Host '--- Checking Prometheus Target Scraping (http://localhost:9090) ---'
                    try {
                        \$prom = Invoke-WebRequest -Uri 'http://localhost:9090/-/healthy' -TimeoutSec 3 -ErrorAction Stop
                        Write-Host '[SUCCESS] Prometheus is responding and healthy.'
                    } catch {
                        Write-Warning '[WARNING] Prometheus probe returned non-200 or timeout.'
                    }

                    Write-Host '--- Checking Grafana Interface (http://localhost:3000) ---'
                    try {
                        \$grafana = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 3 -ErrorAction Stop
                        Write-Host '[SUCCESS] Grafana is responding and healthy.'
                    } catch {
                        Write-Warning '[WARNING] Grafana probe returned non-200 or timeout.'
                    }
                "
                """
            }
        }
    }

    post {
        always {
            echo '--- Post-Build Container Status ---'
            bat "\"${COMPOSE_BIN}\" -p ${COMPOSE_PROJECT_NAME} ps"
        }

        failure {
            echo '======================================================'
            echo 'StockShare CI/CD pipeline failed. Gathering container logs...'
            echo '======================================================'
            bat "\"${COMPOSE_BIN}\" -p ${COMPOSE_PROJECT_NAME} logs --tail=100"
            echo 'Check the above console output and container logs for diagnosis.'
        }

        success {
            echo '======================================================'
            echo 'StockShare CI/CD Deployment Completed Successfully!'
            echo '------------------------------------------------------'
            echo 'Frontend Application : http://localhost:8081'
            echo 'Backend API          : http://localhost:5000'
            echo 'Backend Health Probe : http://localhost:5000/health'
            echo 'Backend Metrics      : http://localhost:5000/metrics'
            echo 'Prometheus Server    : http://localhost:9090'
            echo 'Grafana Dashboards   : http://localhost:3000'
            echo '======================================================'
        }
    }
}