a web interface to the Dyalog interpreter

                    RIDE
    ┌───────────┐ protocol ┌───────┐   HTTPS   ┌───────┐
    │  Dyalog   ├──────────┤ this  ├───────────┤browser│
    │interpreter│:4502     │ thing │:8443      │       │
    └───────────┘          └───────┘           └───────┘

Usage
=====

* Install [NodeJS](http://nodejs.org/download/).  If using a package manager such as `apt` or `yum`, you may want to search for a `nodejs` package there, but please make sure it's no older than v0.10.25.  If using `yum`, you need to install `npm` as well, it's in a separate package.
* If using Windows, do: `mkdir C:\Users\%USERNAME%\AppData\Roaming\npm` after installing Node.  This is to work around [a known problem](https://stackoverflow.com/questions/25093276/nodejs-windows-error-enoent-stat-c-users-rt-appdata-roaming-npm).
* Clone this repository: `git clone https://github.com/Dyalog/RideJS.git` and `cd RideJS`
* Install dependencies: `npm install`.  This only creates a local `node_modules` directory.  No system files are installed.
* Configure RIDE through an environment variable: `export RIDE_LISTEN=0.0.0.0:4502`
* Start the Dyalog interpreter.
* Start the web server with `node node_modules/coffee-script/bin/coffee server.coffee`
* Open [https://127.0.0.1:8443](https://127.0.0.1:8443) in your browser.
* Accept the server's certificate.

![Screenshot](screenshot.png?raw=true "Screenshot")
