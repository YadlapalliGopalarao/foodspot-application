
pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    git --version
                    docker version
                    docker buildx version
                    trivy --version
                    python3 --version
                '''
            }
        }

        stage('Verify Application') {
            steps {
                sh '''
                    test -f foodspot-frontend/Dockerfile
                    test -f user-service/Dockerfile
                    test -f food-service/Dockerfile
                    test -f order-service/Dockerfile
                    test -f notification-service/Dockerfile

                    echo "All five Dockerfiles found"
                '''
            }
        }
    }
}
