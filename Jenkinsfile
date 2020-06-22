pipeline {
  agent none
  stages {
    stage('Build') {
      agent {
        label 'Linux && NodeJS'
      }
      steps {
        checkout scm
        sh 'npm i'
        sh './mk dist'
        sh './publish.sh'
        stash name: 'ride-win', includes: '_/ride44/Ride-4.4-win32*/**'
        stash name: 'ride-linux', includes: '_/ride44/Ride-4.4-linux*/**'
        stash name: 'ride-mac', includes: '_/ride44/Ride-4.4-darwin*/**'
        stash name: 'packagescripts', includes: 'CI/**'
      }
    }
    stage ('Packaging') {
      parallel {
        stage ('Linux Packaging') {
          agent {
            label 'Linux && NodeJS'
          }
          steps {
            unstash 'ride-linux'
           // unstash 'pacakgescripts'
            sh './CI/packagescripts/linux/packageLinux.sh'
            stash name: 'linux-ship', includes: 'ship/*'
          }
        }
        stage ('Mac Packaging') {
          agent {
            label 'Mac && Build'
          }
          steps {
            unstash 'ride-mac'
           // unstash 'pacakgescripts'
            sh './CI/packagescripts/osx/packageOSX.sh'
            stash name: 'mac-ship', includes: 'ship/*'
          }
        }
        stage ('Windows Packaging') {
          agent {
            label 'Windows'
          }
          steps {
            unstash 'ride-win'
           // unstash 'pacakgescripts'
            bat './CI/packagescripts/windows/packageWindows.bat'
            stash name: 'win-ship', includes: 'ship/*'
          }
        }
      }
    }
    stage ('Copy install images') {
      agent {
        label 'Linux'
      }
      steps {
        unstash 'linux-ship'
        unstash 'mac-ship'
        unstash 'win-ship'
        sh './CI/copyinstallers.sh'
      }
    }
    stage ('Publish to Github') {
      agent {
        label 'Linux'
      }
      environment {
        GHTOKEN = credentials('250bdc45-ee69-451a-8783-30701df16935')
      }
      steps {
        sh './CI/GH-Release.sh'
      }
    }
  }
}