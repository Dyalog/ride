                    RIDE                                             RIDE
    ┌────────────┐protocol┌───────────┐     ┌───────┐HTTPS ┌──────┐protocol┌───────────┐
    │Electron app├────────┤interpreter│     │browser├──────┤srv.js├────────┤interpreter│
    └────────────┘   :4502└───────────┘     └───────┘ :8443└──────┘   :4502└───────────┘

         as a desktop application                          in a browser

install [Git](https://git-scm.com/downloads) and [NodeJS v10.13.0](https://nodejs.org/download/release/v10.13.0/)

    git clone https://github.com/dyalog/ride --depth=1
    cd ride
    npm i         # download dependencies
    npm start     # start RIDE (without building native apps)
    node mk dist  # build native apps under _/ride${version}/
    node mk c     # cleans your build directory

(`#` starts a comment)

Dyalog customers can download a pre-built installable RIDE from [MyDyalog](https://my.dyalog.com/) under the Downloads
&gt; RIDE menu.
