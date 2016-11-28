stage ('Allocate shared workspace')
def extWorkspace = exwsAllocate 'rideDiskPool'

node('nodejs') {
	exws (extWorkspace) {
		stage ('Checkout from GitHub')
		git url: 'https://github.com/Dyalog/Ride.git'
		
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
				node('nodejs') {
				sh './PackageLinux'
				}
			}
	},
	"Mac Package" : {
			exws (extWorkspace) {
				node('OSX') {
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

