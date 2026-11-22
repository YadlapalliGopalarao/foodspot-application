// FoodSpot: one CI job, five Dockerfiles, GitHub PAT authentication.
pipeline {
    agent any
    options { skipDefaultCheckout(true); disableConcurrentBuilds(); timestamps() }
    parameters {
        booleanParam(name: 'BUILD_ALL', defaultValue: false,
            description: 'Force rebuild of all five images')
    }
    environment {
        // Update these two values before committing.
        DOCKER_NAMESPACE = 'gopalarao2004'
        DEVOPS_REPO_URL = 'https://github.com/YadlapalliGopalarao/foodspot-devops'
    }
    stages {
        stage('Checkout application') {
            steps {
                checkout scm
                script {
                    env.APP_COMMIT = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.PREV_SUCCESS = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: ''
                    env.IMAGE_TAG = "b${env.BUILD_NUMBER}-${env.APP_COMMIT.take(7)}"
                    echo "Image tag: ${env.IMAGE_TAG}"
                }
            }
        }
        stage('Verify environment') {
            steps {
                sh '''
                    set -eu
                    for tool in git docker trivy python3; do command -v "$tool" >/dev/null; done
                    docker info >/dev/null
                    docker buildx version >/dev/null
                    for folder in foodspot-frontend user-service food-service order-service notification-service; do
                        test -f "$folder/Dockerfile"
                        test -f "$folder/.dockerignore"
                    done
                    test -f ci/update_deployments.py
                    case "$DOCKER_NAMESPACE" in YOUR_*|'') echo 'Set DOCKER_NAMESPACE'; exit 1;; esac
                    case "$DEVOPS_REPO_URL" in *YOUR_*) echo 'Set DEVOPS_REPO_URL'; exit 1;; esac
                '''
            }
        }
        stage('Checkout DevOps repository') {
            steps {
                dir('devops') {
                    git branch: 'main', credentialsId: 'github-token', url: env.DEVOPS_REPO_URL
                }
                sh '''
                    set -eu
                    for service in frontend user food order notification; do
                        test -f "devops/deployments/${service}-deployment.yaml"
                    done
                '''
            }
        }
        stage('Select services') {
            steps {
                script {
                    def folders = [
                        frontend: 'foodspot-frontend/',
                        user: 'user-service/',
                        food: 'food-service/',
                        order: 'order-service/',
                        notification: 'notification-service/'
                    ]
                    def selected = []
                    def validBase = (env.PREV_SUCCESS ==~ /^[0-9a-fA-F]{40}$/)
                    if (validBase) {
                        validBase = sh(script: "git cat-file -e '${env.PREV_SUCCESS}^{commit}'",
                            returnStatus: true) == 0
                    }
                    if (params.BUILD_ALL || !validBase) {
                        selected = folders.keySet().toList()
                        echo 'Building all: first build, forced run, or prior Git commit unavailable.'
                    } else {
                        def changed = sh(script: "git diff --name-only '${env.PREV_SUCCESS}' '${env.APP_COMMIT}'",
                            returnStdout: true).trim()
                        def files = changed ? changed.readLines() : []
                        def shared = files.any { it == 'Jenkinsfile' || it.startsWith('ci/') }
                        selected = shared ? folders.keySet().toList() :
                            folders.findAll { service, folder ->
                                files.any { file -> file.startsWith(folder) }
                            }.keySet().toList()
                    }
                    // Initial deployment uses :bootstrap, which does not exist on Docker Hub.
                    folders.keySet().each { service ->
                        def bootstrap = sh(script: "grep -Eq '^[[:space:]]*image:.*:bootstrap' 'devops/deployments/${service}-deployment.yaml'",
                            returnStatus: true) == 0
                        if (bootstrap && !selected.contains(service)) selected.add(service)
                    }
                    env.SERVICES_TO_BUILD = folders.keySet().findAll { selected.contains(it) }.join(' ')
                    echo "Selected: ${env.SERVICES_TO_BUILD ?: '(none)'}"
                }
            }
        }
        stage('Trivy filesystem scan') {
            when { expression { env.SERVICES_TO_BUILD?.trim() } }
            steps {
                sh 'trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --exit-code 1 --skip-dirs devops .'
            }
        }
        stage('Docker build') {
            when { expression { env.SERVICES_TO_BUILD?.trim() } }
            steps {
                sh '''
                    set -eu
                    for service in $SERVICES_TO_BUILD; do
                        case "$service" in
                            frontend) folder=foodspot-frontend ;;
                            user) folder=user-service ;;
                            food) folder=food-service ;;
                            order) folder=order-service ;;
                            notification) folder=notification-service ;;
                            *) exit 1 ;;
                        esac
                        docker build -t "$DOCKER_NAMESPACE/foodspot-$service:$IMAGE_TAG" "$folder"
                    done
                '''
            }
        }
        stage('Trivy image scan') {
            when { expression { env.SERVICES_TO_BUILD?.trim() } }
            steps {
                sh '''
                    set -eu
                    for service in $SERVICES_TO_BUILD; do
                        trivy image --scanners vuln,secret --severity HIGH,CRITICAL --exit-code 1 \
                            "$DOCKER_NAMESPACE/foodspot-$service:$IMAGE_TAG"
                    done
                '''
            }
        }
        stage('Docker Hub push') {
            when { expression { env.SERVICES_TO_BUILD?.trim() } }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh '''
                        set -eu
                        set +x
                        test "$DOCKER_USER" = "$DOCKER_NAMESPACE" || {
                            echo 'Docker Hub username must match DOCKER_NAMESPACE'; exit 1;
                        }
                        export DOCKER_CONFIG="$(mktemp -d)"
                        trap 'rm -rf "$DOCKER_CONFIG"' EXIT
                        printf '%s' "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USER" --password-stdin
                        for service in $SERVICES_TO_BUILD; do
                            docker push "$DOCKER_NAMESPACE/foodspot-$service:$IMAGE_TAG"
                        done
                    '''
                }
            }
        }
        stage('Update selected YAMLs') {
            when { expression { env.SERVICES_TO_BUILD?.trim() } }
            steps {
                sh '''
                    set -eu
                    for service in $SERVICES_TO_BUILD; do
                        python3 ci/update_deployments.py \
                            --dir devops/deployments \
                            --service "$service" \
                            --image "$DOCKER_NAMESPACE/foodspot-$service:$IMAGE_TAG"
                    done
                    git -C devops diff --check
                    git -C devops diff -- deployments/
                '''
            }
        }
        stage('Push YAML changes to GitHub') {
            when { expression { env.SERVICES_TO_BUILD?.trim() } }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-token',
                    usernameVariable: 'GH_USER',
                    passwordVariable: 'GH_TOKEN'
                )]) {
                    sh '''
                        set -eu
                        git -C devops config user.name 'foodspot-jenkins'
                        git -C devops config user.email 'foodspot-jenkins@users.noreply.github.com'
                        git -C devops add deployments/
                        if git -C devops diff --cached --quiet; then
                            echo 'Deployment manifests already current.'
                            exit 0
                        fi
                        git -C devops commit -m "ci: update image references to $IMAGE_TAG"
                        # Authenticate HTTPS Git push without putting PAT in URL/logs.
                        set +x
                        umask 077
                        ASKPASS_FILE="$(mktemp)"
                        trap 'rm -f "$ASKPASS_FILE"' EXIT
                        cat > "$ASKPASS_FILE" <<'ASKPASS'
#!/bin/sh
case "$1" in
  *Username*) printf '%s\\n' "$GH_USER" ;;
  *Password*) printf '%s\\n' "$GH_TOKEN" ;;
esac
ASKPASS
                        chmod 700 "$ASKPASS_FILE"
                        export GIT_ASKPASS="$ASKPASS_FILE"
                        export GIT_TERMINAL_PROMPT=0
                        git -C devops push origin HEAD:main
                    '''
                }
            }
        }
    }
    post {
        success { echo 'CI finished; changed images published and Deployment YAMLs updated.' }
        failure { echo 'CI failed; check the first failed stage in Console Output.' }
    }
}
