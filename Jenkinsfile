def extWorkspace = exwsAllocate 'rideDiskPool'

node('NodeJS') {
        exws (extWorkspace) {
                stage ('Checkout from GitHub') {
                    git url: 'https://github.com/JasonRivers/Ride.git'
                }
                

                stage ('Update npm modules') {
                    sh 'npm i'
                }
                

                stage ('Build Ride') {
                    sh './mk dist'
                }
                
                stage ('Dyalog Network Publish') {
                    //sh './publish.sh'
                }
                
        }
}

stage ('Packaging') {

    parallel (
        "Linux Package" : {
                        node('NodeJS') {
                                exws (extWorkspace) {
                                sh './packagescripts/linux/packageLinux.sh'
                                }
                        }
        },
        "Mac Package" : {
                        node('MAC') {
                                exws (extWorkspace) {
                                sh './packagescripts/osx/packageOSX.sh'
                                }
                        }
        },
        "Windows Package" : {
                        node('Windows') {
                                exws (extWorkspace) {
                                bat '\packagescripts\windows\packageWindows.bat'
                                }
                        }
        }
    )
}
