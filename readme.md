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
* `build/ride30/linux64/ride30  # start RIDE`

##Windows
* install [Virtual Box](https://www.virtualbox.org/), [Vagrant](https://www.vagrantup.com/),
   and [GitHub for Windows](https://windows.github.com/) &ndash; set your Git Shell to `bash` in the options
* clone [ride](https://www.github.com/dyalog/ride) in GitHub for Windows
* right-click repository and "Open in git Shell"
* run `./vagrantbuild.sh`

##OS X
* install [Virtual Box](https://www.virtualbox.org/), [Vagrant](https://www.vagrantup.com/), and Git
* clone [ride](https://www.github.com/dyalog/ride)
* cd to `ride` directory and run `./vagrantbuild.sh`

The first build will take a long time.

On Windows and OS X the build process will automatically launch RIDE once it has finished building.
When you are finished building, run `vagrant halt` to stop the virtual build machine.
