![Screenshot](docs/s0.png?raw=true "Screenshot")
![Screenshot](docs/s1.png?raw=true "Screenshot")
![Screenshot](docs/s2.png?raw=true "Screenshot")

# Architecture
## As a desktop application
    ┌────────┐
    │NW.js   │   RIDE
    │ ┌─────┐│ protocol ┌───────────┐
    │ │proxy├┼──────────┤interpreter│
    │ └─────┘│     :4502└───────────┘
    └────────┘

## In a browser
                              RIDE
    ┌───────┐ HTTPS ┌─────┐ protocol ┌───────────┐
    │browser├───────┤proxy├──────────┤interpreter│
    └───────┘  :8443└─────┘     :4502└───────────┘

# Building
## Prerequisites

<strong>All Operating Systems</strong>
* [Virtual Box](https://www.virtualbox.org/)
* [Vagrant](https://www.vagrantup.com/)
* git (for Windows see below)

<strong>Windows</strong>
* [Github for windows](https://windows.github.com/)

You will need to set your Git Shell to `Bash` in the options

## Build

<strong>Windows</strong>

* clone [ride](https://www.github.com/dyalog/ride) in Github for Windows
* right-click repository and `Open in git Shell`
* run `./vagrantbuild.sh`

<strong>Linux/OS X</strong>
* clone [ride](https://www.github.com/dyalog/ride)
* cd to "ride" directory
* run `./vagrantbuild.sh`

The build process will automatically launch RIDE once it has finished building.
The first build will take a long time.

When you are finished building, run `vagrant halt` to stop the virtual build machine.
