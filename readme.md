# RIDE

RIDE is a remote IDE for [Dyalog](www.dyalog.com) APL.

![Screenshot](/screenshot.png?raw=true)

## Getting started

**Option 1:** Download and install the
[latest release](https://github.com/Dyalog/ride/releases/latest) from this
repository.

**Option 2:** Build RIDE from source:

install [Git](https://git-scm.com/downloads) and [NodeJS v16.16.0](https://nodejs.org/download/release/v16.16.0/)

    git clone https://github.com/dyalog/ride --depth=1
    cd ride
    npm i         # download dependencies
    npm start     # start RIDE (without building native apps)
    node mk dist  # build native apps under _/ride${version}/
    node mk c     # cleans your build directory

(`#` starts a comment)
