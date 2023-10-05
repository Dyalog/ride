# RIDE

RIDE is a remote IDE for [Dyalog](https://www.dyalog.com) APL.  
[Documentation](https://dyalog.github.io/ride) for Ride.

![Screenshot](/screenshot.png?raw=true)

## Getting started

**Option 1:** Download and install the
[latest release](https://github.com/Dyalog/ride/releases/latest) from this
repository.

**Option 2:** Build RIDE from source:

Install [Git](https://git-scm.com/downloads) and [NodeJS v18.17.0](https://nodejs.org/download/release/v18.17.0/)

    git clone https://github.com/dyalog/ride --depth=1
    cd ride
    npm i              # download dependencies
    npm run css        # compile css
    npm run dev        # compile css and start RIDE
    npm start          # start RIDE (without building native apps)
    npm run build dist # compile css and build native apps under _/ride${version}/
    npm run clean      # cleans your build directory

`npm run build dist` builds for all platforms. 

You can also build platforms separately:

    npm run build {CODE}

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
