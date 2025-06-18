@Library("Shared") _
pipeline {
    agent {label 'ishtiaq'}

    stages {
         stage('Hello') {
            steps {
                script{
                    hello()
                }
            }
        }
        stage('Code Clone') {
            steps {
                script{
                    clone('https://github.com/ishtiaqahmadbhatti/simple-angular-docker', 'main')
                }
            }
        }
        stage('Build Image') {
            steps {
                script{
                    build("snakegame","latest","ishtiaqahmad913")
                }
            }
        }
        stage('Push Image') {
            steps {
               script{
                   push("snakegame","latest")
               }
            }
        }
        stage('Run Container') {
            steps {
                echo 'This is Running the image.'
                sh 'docker compose up -d'
                echo 'Container Running Successfully.'
            }
        }
    }
}
