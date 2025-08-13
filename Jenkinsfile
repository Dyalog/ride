pipeline {
  options {
    disableConcurrentBuilds()
  }
  agent none
  stages {
    stage('Build Linux & Windows') {
      agent {
        docker {
          image 'dyalogci/node:22'
          registryCredentialsId '0435817a-5f0f-47e1-9dcc-800d85e5c335'
          args '-v /devt:/devt'
        }
      }
      steps {
        checkout scm
        sh 'rm -Rf _ ship'
        sh 'npm i'
        sh 'npm run build l a w la'
        sh './CI/publish.sh'
        stash name: 'ride-win', includes: '_/ride*/Ride-*-win32-ia32/**'
        stash name: 'ride-linux', includes: '_/ride*/Ride-*-linux*/**'
        stash name: 'ride-version', includes: '_/version, _/version.js'
        sh 'rm -Rf _'
      }
    }
    stage ('Packaging') {
      parallel {
        stage ('Linux Packaging') {
          agent {
            docker {
              image 'dyalogci/node:22'
              registryCredentialsId '0435817a-5f0f-47e1-9dcc-800d85e5c335'
            }
          }
          steps {
            sh 'rm -Rf _ ship'
            unstash 'ride-linux'
            unstash 'ride-version'
            sh './CI/packagescripts/linux/packageLinux.sh'
            stash name: 'linux-ship', includes: 'ship/*'
            sh 'rm -Rf _ ship'
          }
        }
        stage ('Mac Build and Packaging (x86)') {
          agent {
            label 'mac && x86 && build && ride'
          }
          steps {
            sh 'rm -Rf _ ship'
            sh 'npm i'
            sh 'npm run build o'
            withCredentials([usernamePassword(credentialsId: '868dda6c-aaec-4ee4-845a-57362dec695b', passwordVariable: 'APPLE_APP_PASS', usernameVariable: 'APPLE_ID')]) {
              sh './CI/packagescripts/osx/packageOSX.sh'
            }
            stash name: 'ride-mac', includes: '_/ride*/Ride-*-darwin*/**'
            stash name: 'mac-ship', includes: 'ship/*'
            sh 'rm -Rf _ ship'
          }
        }
//AWS        stage ('Mac Build and Packaging (arm)') {
//AWS          agent {
//AWS            label 'mac && arm && build && ride'
//AWS          }
//AWS          steps {
//AWS            sh 'rm -Rf _ ship'
//AWS            sh 'npm i'
//AWS            sh 'npm run build oa'
//AWS            withCredentials([usernamePassword(credentialsId: '868dda6c-aaec-4ee4-845a-57362dec695b', passwordVariable: 'APPLE_APP_PASS', usernameVariable: 'APPLE_ID')]) {
//AWS              sh './CI/packagescripts/osx/packageOSX.sh'
//AWS            }
//AWS            stash name: 'ride-macarm', includes: '_/ride*/Ride-*-darwin*/**'
//AWS            stash name: 'macarm-ship', includes: 'ship/*'
//AWS            sh 'rm -Rf _ ship'
//AWS          }
//AWS        }
        stage ('Windows Packaging') {
          agent {
            label 'win && ride'
          }
          steps {
            powershell 'if (Test-Path -Path ship) {remove-item ship -Recurse -Force }'
            powershell 'if (Test-Path -Path _) { remove-item _ -Recurse -Force }'
            unstash 'ride-win'
            unstash 'ride-version'
            bat './CI/packagescripts/windows/packageWindows.bat'
            stash name: 'win-ship', includes: 'ship/*'
            powershell 'remove-item ship -Recurse -Force'
            powershell 'remove-item _ -Recurse -Force'
          }
        }
      }
      when {
        not {
          branch 'PR-*'
        }
      }
    }
//AWS    stage ('OSX Notorise') {
//AWS      agent {
//AWS        label 'notarytool'
//AWS      }
//AWS      steps {
//AWS        sh 'rm -Rf ship'
//AWS        sh 'rm -Rf _'
//AWS        unstash 'ride-version'
//AWS        unstash 'mac-ship'
//AWS        unstash 'macarm-ship'
//AWS        withCredentials([usernamePassword(credentialsId: '868dda6c-aaec-4ee4-845a-57362dec695b', passwordVariable: 'APPLE_APP_PASS', usernameVariable: 'APPLE_ID')]) {
//AWS          sh "CI/packagescripts/osx/notarise.sh"
//AWS        }
//AWS        stash name: 'mac-ship-notarised', includes: 'ship/*'
//AWS      }
//AWS      when {
//AWS        not {
//AWS          branch 'PR-*'
//AWS        }
//AWS      }
//AWS    }
    stage ('Copy install images') {
      agent {
        docker {
          image 'dyalogci/node:22'
          registryCredentialsId '0435817a-5f0f-47e1-9dcc-800d85e5c335'
          args '-v /devt:/devt'
        }
      }
      steps {
        sh 'rm -Rf _ ship'
        unstash 'ride-win'
//AWS        unstash 'ride-mac'
//AWS        unstash 'ride-macarm'
        unstash 'ride-linux'
        unstash 'ride-version'
        unstash 'linux-ship'
//AWS        unstash 'mac-ship-notarised'
        unstash 'win-ship'
        sh './CI/copyinstallers.sh'
        sh 'rm -Rf _ ship'
      }
      when {
        not {
          branch 'PR-*'
        }
      }
    }
    stage ('Publish to Github') {
      agent {
        docker {
          image 'dyalogci/node:22'
          registryCredentialsId '0435817a-5f0f-47e1-9dcc-800d85e5c335'
          args '-v /devt:/devt'
        }
      }
      environment {
        GHTOKEN = credentials('250bdc45-ee69-451a-8783-30701df16935')
      }
      steps {
        sh 'rm -Rf _ ship'
        unstash 'ride-version'
        unstash 'linux-ship'
 //AWS       unstash 'mac-ship-notarised'
        unstash 'win-ship'
        sh './CI/GH-Release.sh'
        sh 'rm -Rf _ ship'
      }
      when {
        not {
          branch 'PR-*'
        }
      }
    }
  }
}
