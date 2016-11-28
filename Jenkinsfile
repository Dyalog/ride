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
			exws (extWorkspace) {
				node('NodeJS') {
				sh './PackageLinux'
				}
			}
	},
	"Mac Package" : {
			exws (extWorkspace) {
				node('MAC') {
				sh './PackageOSX'
				}
			}
	},
	"Windows Package" : {
			exws (extWorkspace) {
				node('Windows') {
				bat 'PackageWindows.bat'
				}
			}
	}
)

