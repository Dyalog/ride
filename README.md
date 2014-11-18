a web interface to the Dyalog interpreter

Usage from a browser
====================
                                RIDE
    ┌───────┐  HTTPS  ┌─────┐ protocol ┌───────────┐
    │browser├─────────┤proxy├──────────┤interpreter│
    └───────┘    :8443└─────┘     :4502└───────────┘
* Install [NodeJS](http://nodejs.org/download/).  If using a package manager such as `apt` or `yum`, you may want to search for a `nodejs` package there, but please make sure it's no older than v0.10.25.  If using `yum`, you need to install `npm` as well, it's in a separate package.
* If using Windows, do: `mkdir C:\Users\%USERNAME%\AppData\Roaming\npm` after installing Node.  This is to work around [a known problem](https://stackoverflow.com/questions/25093276/nodejs-windows-error-enoent-stat-c-users-rt-appdata-roaming-npm).
* Clone this repository: `git clone https://github.com/Dyalog/RideJS.git` and `cd RideJS`
* Install dependencies: `npm install`.  This only creates a local `node_modules` directory.  No system files are installed.
* Configure RIDE through an environment variable: `export RIDE_LISTEN=0.0.0.0:4502`
* Start the Dyalog interpreter.
* Run `./build.sh`
* Start the web server with `node node_modules/coffee-script/bin/coffee server.coffee`
* Open [https://127.0.0.1:8443](https://127.0.0.1:8443) in your browser.
* Accept the server's certificate.

![Screenshot](screenshot.png?raw=true "Screenshot")

Usage as a desktop application
==============================
In addition to the above, this IDE can be packaged as a desktop application for Linux, Windows, and Mac OS.

    ┌───────────┐
    │node-webkit│   RIDE
    │    ┌─────┐│ protocol ┌───────────┐
    │    │proxy├┼──────────┤interpreter│
    │    └─────┘│     :4502└───────────┘
    └───────────┘
[node-webkit](https://github.com/rogerwang/node-webkit) is an app runtime based on Chromium and NodeJS.
It is capable of containing both the proxy and the browser component in the same process, so communication between them can be short-circuited.
To package apps for the various platforms, run
    ./dist.sh
and find them under `./build/dyalogjs/`.

The desktop app is envisioned to be able to:

* connect to an interpreter at a specified host:port
* listen for a connection from an interpreter at a specified port (not yet implemented)
* spawn an interpreter process and connect to it (not yet implemented)
