stage ('Allocate shared workspace')
def extWorkspace = exwsAllocate 'rideDiskPool'

node('NodeJS') {
	exws (extWorkspace) {
		stage ('Checkout from GitHub')
		git url: 'https://github.com/Dyalog/Ride.git'

		stage ('Update npm modules')
		sh 'npm i'
		
		stage ('Build Ride')
		sh './mk dist'
		stage ('Dyalog Network Publish')
		sh './publish.sh'
	}
}

stage ('Packaging')

parallel (
	"Linux Package" : {
			node('NodeJS') {
				exws (extWorkspace) {
				sh './PackageLinux'
				}
			}
	},
	"Mac Package" : {
			node('MAC') {
				exws (extWorkspace) {
				sh './PackageOSX'
				}
			}
	},
	"Windows Package" : {
			node('Windows') {
				exws (extWorkspace) {
				bat 'PackageWindows.bat'
				}
			}
	}
)

