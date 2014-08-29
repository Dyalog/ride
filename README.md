a web interface to the Dyalog interpreter

                    RIDE
    ┌───────────┐ protocol ┌───────┐   HTTPS   ┌───────┐
    │  Dyalog   ├──────────┤ this  ├───────────┤browser│
    │interpreter│:4502     │ thing │:8443      │       │
    └───────────┘          └───────┘           └───────┘

Usage
=====

* Install [NodeJS](http://nodejs.org/download/).

* If using Windows, do: `mkdir C:\Users\%USERNAME%\AppData\Roaming\npm` after
installing Node.  This is to work around [a known
problem](https://stackoverflow.com/questions/25093276/nodejs-windows-error-enoent-stat-c-users-rt-appdata-roaming-npm).

* Clone this repository: `git clone https://github.com/Dyalog/RideJS.git ; cd RideJS`
* Install dependencies: `npm install`
* Configure RIDE through an environment variable: `export RIDE_LISTEN=0.0.0.0:4502`
* Start the Dyalog interpreter.
* Start the middleware with `node_modules/coffee-script/bin/coffee a.coffee`
* Open [https://127.0.0.1:8443](https://127.0.0.1:8443) in your browser.
* Accept the server's certificate.
