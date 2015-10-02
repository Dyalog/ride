![Screenshot](docs/s0.png?raw=true "Screenshot")
![Screenshot](docs/s1.png?raw=true "Screenshot")
![Screenshot](docs/s2.png?raw=true "Screenshot")

#Architecture
    ┌───────┐
    │NW.js  │  RIDE                                          RIDE
    │┌─────┐│protocol┌───────────┐   ┌───────┐HTTPS ┌─────┐protocol┌───────────┐
    ││proxy├┼────────┤interpreter│   │browser├──────┤proxy├────────┤interpreter│
    │└─────┘│   :4502└───────────┘   └───────┘ :8443└─────┘   :4502└───────────┘
    └───────┘
       as a desktop application                    in a browser

#Build

##Linux

* install NodeJS (preferably [the latest](https://nodejs.org/en/download/)) and Git
* `git clone https://github.com/dyalog/ride --depth=1`
* `cd ride`
* `npm i  # npm is a tool that comes with nodejs, it downloads js dependencies`
* `./dist.sh linux64  # downloads NW.js on first run, may take a few minutes`
* `build/ride20/linux64/ride20  # start RIDE`

##Windows

* install [Virtual Box](https://www.virtualbox.org/)
* install [Vagrant](https://www.vagrantup.com/)
* install [GitHub for Windows](https://windows.github.com/) &ndash; set your Git Shell to `bash` in the options
* clone [ride](https://www.github.com/dyalog/ride) in GitHub for Windows
* right-click repository and `Open in git Shell`
* run `./vagrantbuild.sh`

##OS X

* install [Virtual Box](https://www.virtualbox.org/)
* install [Vagrant](https://www.vagrantup.com/)
* install git
* clone [ride](https://www.github.com/dyalog/ride)
* cd to "ride" directory
* run `./vagrantbuild.sh`

The build process will automatically launch RIDE once it has finished building.
The first build will take a long time.

When you are finished building, run `vagrant halt` to stop the virtual build machine.
