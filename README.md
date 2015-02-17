a web interface to the Dyalog interpreter

![Screenshot](screenshot0.png?raw=true "Screenshot")
![Screenshot](screenshot1.png?raw=true "Screenshot")

From a browser
==============
                              RIDE
    ┌───────┐ HTTPS ┌─────┐ protocol ┌───────────┐
    │browser├───────┤proxy├──────────┤interpreter│
    └───────┘  :8443└─────┘     :4502└───────────┘

As a desktop application
========================
    ┌────────┐
    │NW.js   │   RIDE
    │ ┌─────┐│ protocol ┌───────────┐
    │ │proxy├┼──────────┤interpreter│
    │ └─────┘│     :4502└───────────┘
    └────────┘

[NW.js](https://github.com/nwjs/nw.js) is an app runtime based on Chromium and NodeJS.
It is capable of containing both the proxy and the browser component in the same process, so communication between them can be short-circuited.
To package apps for the various platforms, run
    ./dist.sh
and find them under `./build/ride/`.

The desktop app can

* connect to an interpreter at a specified host:port
* spawn an interpreter process and connect to it
* listen for a connection from an interpreter at a specified port

Building
========

<h3>Prerequisites</h3>

<strong>All Operating Systems</strong>
* [Virtual Box](https://www.virtualbox.org/)
* [Vagrant](https://www.vagrantup.com/)
* git (for Windows see below)

<strong>Windows</strong>
* [Github for windows](https://windows.github.com/)

You will need to set your Git Shell to `Bash` in the options

<h3>Build</h3>

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
