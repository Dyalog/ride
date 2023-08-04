# RIDE

RIDE is a remote IDE for [Dyalog](https://www.dyalog.com) APL.

![Screenshot](/screenshot.png?raw=true)

## Getting started

**Option 1:** Download and install the
[latest release](https://github.com/Dyalog/ride/releases/latest) from this
repository.

**Option 2:** Build RIDE from source:

Install [Git](https://git-scm.com/downloads) and [NodeJS v18.17.0](https://nodejs.org/download/release/v18.17.0/)

    git clone https://github.com/dyalog/ride --depth=1
    cd ride
    npm i         # download dependencies
    npm start     # start RIDE (without building native apps)
    node mk dist  # build native apps under _/ride${version}/
    node mk c     # cleans your build directory

`node mk dist` builds for all platforms. 

You can also build platforms separately:

    node mk {CODE}

where `{CODE}` is one of

|CODE|OS       |ARCH  |
|----|---------|------|
|w   | win32   |ia32  |
|l   | linux   |x64   |
|o   | darwin  |x64   |
|oa  | darwin  |arm64 |
|m   | mas     |x64   |
|ma  | mas     |arm64 |
|a   | linux   |armv7l|


(`#` starts a comment)
