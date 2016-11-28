stage ('Allocate shared workspace')
def extWorkspace = exwsAllocate 'diskpool1'

node('nodejs') {
	exws (estWorkspace) {
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
			exws (estWorkspace) {
				node('nodejs') {
				sh './PackageLinux'
				}
			}
	},
	"Mac Package" : {
			exws (estWorkspace) {
				node('OSX') {
				sh './PackageOSX'
				}
			}
	},
	"Windows Package" : {
			exws (estWorkspace) {
				node('Windows') {
				bat 'PackageWindows.bat'
				}
			}
	}
)

