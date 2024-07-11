# Starting a Dyalog Session

!!!note
    When running a Dyalog Session through Ride, that Session should only be accessed through Ride. One exception to this rule is when developing or running applications that are `⎕SM`/`⎕SR` based; access to the `⎕SM` window cannot be made through Ride.

When running a Dyalog Session through Ride, the Session can be:

- local to the machine on which Ride is running. 
    
    This requires Dyalog to be installed on the machine on which Ride is running.

- remote from the machine on which Ride is running.

    Ride can start a Session using an interpreter installed on a remote machine irrespective of whether Dyalog is installed on the machine on which Ride is running. In this situation:

    - The operating system on which the remote interpreter is running is irrelevant – the instructions given in this chapter apply to the operating system on which Ride is running (the two operating systems do not have to be the same).
    - The remote machine does not need to have Ride installed but the Dyalog Session must be [Ride-enabled](ridespecific_language_features.md/#ride_init).

Normally, connections between Ride and interpreters are initialised from the **New Session** screen. The exception to this is zero-footprint use, which always requires Dyalog to be started first with suitable configuration parameters, after which Ride will appear when you direct a web browser at the APL interpreter. See [Ride in the browser](ride_in_the_browser.md) for details.


## New Session window

The **New Session** screen is displayed when Ride starts, unless "Auto-start top-most configuration when Ride starts" has been selected from Preferences > General > Session (the default on macOS). This screen allows simple and advanced use.

### Simple usage

Click the 🞂 icon for the configuartion you want to launch. Configurations for all locally installed Dyalog versions are automatically shown unless manually removed. 

### Advanced usage

<kbd>↑</kbd>/<kbd>↓</kbd> select the previous/next configuration. <kbd>Home</kbd>/<kbd>End</kbd> selects the first/last configuration. <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> moves the currently selected configuration up/down in the list. 

You can add new custom configurations (for example for remote interpreters) by clicking <kbd>NEW…</kbd> or modify an existing configuration by clicking its ⚙ icon.

Either of these will open the advanced configuration pane where you can choose connection type and protocol, provide the interpreter with arguments and configuration parameters, and more.

For example:

* If you want Ride to connect to a remote interpreter that has been started with the configuration parameter `RIDE_INIT="SERVE:*:4502"` then create a new configuration of type "Connect to an interpreter", then specify IP address and port 4502.
* If you want Ride to await an incoming connection from a remote interpreter that will be started with the configuration parameter `RIDE_INIT="CONNECT:jaypc.dyalog.bramley:4502"` (where your address is `jaypc.dyalog.bramley`) then choose "Listen", and specify port 4502.

Click <kbd>OK</kbd> to connect, start, or begin listening — per the current settings.

