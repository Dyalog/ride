    ┌────────┐
    │Electron│  RIDE                                          RIDE
    │┌──────┐│protocol┌───────────┐   ┌───────┐HTTPS ┌─────┐protocol┌───────────┐
    ││proxy ├┼────────┤interpreter│   │browser├──────┤proxy├────────┤interpreter│
    │└──────┘│   :4502└───────────┘   └───────┘ :8443└─────┘   :4502└───────────┘
    └────────┘
       as a desktop application                    in a browser

* install [Git](https://git-scm.com/downloads)
* `git clone https://github.com/dyalog/ride --depth=1`
* `cd ride`
* install [NodeJS v6.1.0](https://nodejs.org/download/release/v6.1.0/)
* `npm i         # download dependencies`
* `node build.js # build RIDE`
* `npm start     # start RIDE`
