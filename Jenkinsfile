def extWorkspace = exwsAllocate 'sharedWorkspace'

node('Linux && NodeJS && sharedworkspace') {
        exws (extWorkspace) {
                stage ('Checkout from GitHub') {
                    git url: 'https://github.com/Dyalog/Ride.git'
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
                        node('MAC && sharedworkspace') {
                                exws (extWorkspace) {
                                sh './packagescripts/osx/packageOSX.sh'
                                }
                        }
        },
        "Windows Package" : {
                        node('Windows && WIX && sharedworkspace') {
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
			// Copy installer images to /devt/build/ride/
			sh './copyinstallers.sh'
		}
	}
}
