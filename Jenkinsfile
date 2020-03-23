def extWorkspace = exwsAllocate 'sharedWorkspace'

node('Linux && NodeJS && sharedworkspace') {
    exws (extWorkspace) {
        stage ('Checkout from GitHub') {
            checkout scm
        }

        stage ('Update npm modules') {
            sh 'npm i'
        }

        stage ('Build Ride') {
            // Build RIDE for all platforms
            sh './mk dist'
        }

        stage ('Dyalog Network Publish') {
            // Copy built files to /devt/builds/ride/
            sh './publish.sh'
        }
    }
}

stage ('Packaging') {
    parallel (
        "Linux Package" : {
            node('Linux && NodeJS && sharedworkspace') {
                exws (extWorkspace) {
                    sh './packagescripts/linux/packageLinux.sh'
                }
            }
        },
        "Mac Package" : {
            node('Mac && sharedworkspace') {
                exws (extWorkspace) {
                    sh './packagescripts/osx/packageOSX.sh'
                }
            }
        },
        "Windows Package" : {
            node('Windows && sharedworkspace') {
                exws (extWorkspace) {
                    bat 'packagescripts/windows/packageWindows.bat'
                }
            }
        }
    )
}

stage ('Copy Install Images') {
    node('Linux && sharedworkspace && git') {
        exws (extWorkspace) {
            // Copy installer images to /devt/builds/ride/
            sh './copyinstallers.sh'
        }
    }
}

stage ('Upload to installers to Github') {
    node('Linux && sharedworkspace && NodeJS') {
        exws (extWorkspace) {
//            withCredentials([usernamePassword(credentialsId: '9f5481da-1a4d-4c5d-b400-cc2ee3a3ac2c', passwordVariable: 'GHTOKEN', usernameVariable: 'API')]) {
            withCredentials([string(credentialsId: '112b0db7-e903-40c0-b70c-aab2394b3617', variable: 'GHTOKEN')]) {
                sh './GH-Release.sh'
            }
        }
    }
}

node() {
    stage ('Send Emails') {
        step([
            $class: 'Mailer',
            notifyEveryUnstableBuild: true,
            recipients: 'ride@dyalog.com',
            sendToIndividuals: true
        ])
    }
}
