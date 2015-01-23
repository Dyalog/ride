a web interface to the Dyalog interpreter

From a browser
==============
                                RIDE
    ┌───────┐  HTTPS  ┌─────┐ protocol ┌───────────┐
    │browser├─────────┤proxy├──────────┤interpreter│
    └───────┘    :8443└─────┘     :4502└───────────┘

As a desktop application
========================
    ┌───────────┐
    │node-webkit│   RIDE
    │    ┌─────┐│ protocol ┌───────────┐
    │    │proxy├┼──────────┤interpreter│
    │    └─────┘│     :4502└───────────┘
    └───────────┘

[NW.js](https://github.com/nwjs/nw.js) is an app runtime based on Chromium and NodeJS.
It is capable of containing both the proxy and the browser component in the same process, so communication between them can be short-circuited.
To package apps for the various platforms, run
    ./dist.sh
and find them under `./build/dyalogjs/`.

The desktop app can

* connect to an interpreter at a specified host:port
* spawn an interpreter process and connect to it
* listen for a connection from an interpreter at a specified port
