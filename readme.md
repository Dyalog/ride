    ┌────────┐
    │Electron│  RIDE                                          RIDE
    │┌──────┐│protocol┌───────────┐   ┌───────┐HTTPS ┌─────┐protocol┌───────────┐
    ││proxy ├┼────────┤interpreter│   │browser├──────┤proxy├────────┤interpreter│
    │└──────┘│   :4502└───────────┘   └───────┘ :8443└─────┘   :4502└───────────┘
    └────────┘
       as a desktop application                    in a browser

* install Git
* install [NodeJS v6.1.0](https://nodejs.org/download/release/v6.1.0/)
* `git clone https://github.com/dyalog/ride --depth=1`
* `cd ride`
* `npm i  # npm is a tool that comes with nodejs, it downloads dependencies`
* `./build.sh`
* `npm start  # start RIDE`
