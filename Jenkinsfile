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
        stage('Clone') {
            steps {
                script{
                    clone('https://github.com/ishtiaqahmadbhatti/simple-angular-docker', 'main')
                }
            }
        }
        stage('Build') {
            steps {
                script{
                    build("snakegame","latest","ishtiaqahmad913")
                }
            }
        }
        stage('Push') {
            steps {
               script{
                   push("snakegame","latest")
               }
            }
        }
        stage('Deploy') {
            steps {
                echo 'This is Running the image.'
                sh 'docker compose down && docker compose up -d'
                echo 'Container Running Successfully.'
            }
        }
    }
}
