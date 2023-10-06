# Starting a Dyalog Session

!!!note
    When running a Dyalog Session through RIDE, that Session should only be accessed through RIDE. One exception to this rule is when developing or running applications that are `⎕SM`/`⎕SR` based; access to the `⎕SM` window cannot be made through RIDE.

When running a Dyalog Session through RIDE, the Session can be:

- local to the machine on which RIDE is running. 
    
    This requires Dyalog to be installed on the machine on which RIDE is running.

- remote from the machine on which RIDE is running.

    The RIDE can start a Session using an interpreter installed on a remote machine irrespective of whether Dyalog is installed on the machine on which RIDE is running. In this situation:

    - The operating system on which the remote interpreter is running is irrelevant – the instructions given in this chapter apply to the operating system on which RIDE is running (the two operating systems do not have to be the same).
    - The remote machine does not need to have RIDE installed but the Dyalog Session must be [RIDE-enabled](ridespecific_language_features.md/#ride_init).

Normally, connections between RIDE and interpreters are initialised from the **New Session** window. The exception to this is zero-footprint use, which always requires Dyalog to be started first with suitable configuration parameters, after which RIDE will appear when you direct a web browser at the APL interpreter. See [Zero Footprint Ride](#zero-footprint-mode) for details.


## New Session screen

The **New Session** window is displayed when RIDE starts, unless disabled in the preferences (the default on macOS). This window allows simple and advanced use.

### Simple usage

Click 🞂 for the configuartion you want to launch. Configurations for all locally installed Dyalog versions are automatically shown. 

### Advanced usage

You can add new custom configurations (for example for remote interpreters) by clicking <kbd>NEW…</kbd>.

You can modify an existing configuration by selecting it and clicking <img src="../img/screenshots/expand-CfgDetails.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 14px;" />.

Either of these will open the advanced configuration pane where you can choose connection type and protocol, provide the interpreter with arguments and configuration parameters, and more.

For example:

* If you want RIDE to connect to a remote interpreter that has been started with the configuration parameter `RIDE_INIT="SERVE:*:4502"` then create a new configuration of type "Connect", then specify IP address and port 4502.
* If you want RIDE to await an incoming connection from a remote interpreter that will be started with the configuration parameter `RIDE_INIT="CONNECT:jaypc.dyalog.bramley:4502"` (where your address is `jaypc.dyalog.bramley`) then choose "Listen", and specify port 4502.

## Zero-Footprint Mode

Dyalog can serve RIDE to any modern web browser – this is known as "zero-footprint" operation since RIDE is not installed on the client machine but is downloaded by the web browser on demand. The advantage is that an APL session can be monitored and maintained from any device without installing anything.

This mode has the following limitations:

- You can only interact with the APL interpreter that is serving you; the **New Session** window is not available.
- Preferences are persisted in browser storage using cookies.
- Window captions cannot be controlled.
- The floating **Trace/Edit** windows option is not available.

### Accessing Zero-Footprint RIDE from a browser

1. If on Windows, [install zero-footprint RIDE](installation.md/#windows)
2. Set the `RIDE_INIT` configuration parameter to `HTTP:address:port` (see [RIDE Init](ridespecific_language_features.md/#ride_init)), for example, `RIDE_INIT=HTTP:*:8080`.
3. Start a Dyalog session.
4. Navigate to `http://<address>:<port>`, for example, `http://10.0.38.1:8080`.

On non-Windows platforms, the interpreter expects to find zero-footprint RIDE installed at the `[DYALOG]/RIDEapp` directory; this removes the need to include the `HTTPDIR` field in a [configuration file](installation.md#configuration-ini-file).
