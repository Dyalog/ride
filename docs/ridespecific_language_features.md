# RIDE-Specific Language Features

When running a Dyalog Session through the RIDE, the majority of language features remain unaltered. However, there are a few additional features (see [I-beams](ibeams.md) and [RIDE-Specific Configuration Parameters](configuration_parameters_ridespecific.md)) and some existing functionality that is meaningless (see [Unsupported Language Elements](unsupported_language_elements.md)) when a Session is running through the RIDE.

## I-Beams

I-Beam is a monadic operator that provides a range of system-related services.

Syntax: `R←{X}(A⌶)Y`

Any service provided using an I-Beam should be considered as experimental and subject to change – without notice – from one release to the next. Any use of I-Beams in applications should, therefore, be carefully isolated in cover-functions that can be adjusted if necessary.

There are three I-Beams that are only relevant to the RIDE: [3500⌶](3500_ibeam_ride.md), [3501⌶](3501_ibeam_ride.md) and [3502⌶](3502_ibeam_ride.md).


### 3500⌶ (Send HTML to the RIDE)

Syntax: `R←{X}(3500⌶)Y`

Optionally, `X` is a simple character vector or scalar, the contents of which are used as the caption of an embedded browser window opened by the RIDE client. If omitted, then the caption defaults to `3500⌶`.

`Y` is a simple character vector of HTML markup, the contents of which are displayed in the embedded browser tab.

`R` identifies whether the write to the RIDE was successful. 

Possible values are:

- `0`: the write to the RIDE client was successful
- `¯1`: the RIDE client is not enabled

### 3501⌶ (Connected to the RIDE?)

Syntax: `R←{X}(3501⌶)Y`

`X` and `Y` can be any value (ignored).

`R` identifies whether the Dyalog Session is running through the RIDE. 

Possible values are:

- `0`: the Session is not running through the RIDE
- `1`: the Session is running through the RIDE

### 3502⌶ (Manage RIDE Connectors)

By default, the RIDE is not enabled on run-time executables. For security reasons, enabling the RIDE is a two-step process rather than using (for example) a single configuration parameter. To enable the RIDE, two steps must be taken:

1. Set the `RIDE_INIT` configuration parameter (see [RIDE Init](ride_init.md)) on the machine on which the run-time interpreter is running to an appropriate value.
2. Execute `3502⌶1` in your application code.

The run time interpreter can then attempt to connect to a RIDE client.

Enabling the RIDE to access applications that use the run-time interpreter means that the APL code of those applications can be accessed. The I-beam mechanism described above means that the APL code itself must grant the right for a RIDE client to connect to the run time interpreter. Although Dyalog Ltd might change the details of this mechanism, the APL code will always need to grant connection rights. In particular, no mechanism that is only dependent on configuration parameters will be implemented.

Syntax: `R←3502⌶Y`

`R` is `0` if the call is successful, otherwise an integer (positive or negative) is returned.

`Y` can be any of the following possible values:

- `0` : disable any active RIDE connections.`R` is always `0`
- `R` is always `0`
- `1` : enable the RIDE using the initialisation string defined in the RIDE_INIT configuration parameter: if `R` is `0`, then the RIDE was disabled and is now successfully enabledif `R` is `¯1`, then the RIDE was already activeif `R` is `32`, then the RIDE DLL/shared library is not availableif `R` is `64`, then the `RIDE_INIT` configuration parameter is not correctly defined
- if `R` is `0`, then the RIDE was disabled and is now successfully enabled
- if `R` is `¯1`, then the RIDE was already active
- if `R` is `32`, then the RIDE DLL/shared library is not available
- if `R` is `64`, then the RIDE_INIT configuration parameter is not correctly defined
- a simple character vector : replace the RIDE_INIT configuration parameter with the specified initialisation string, which should be in the format specified in [RIDE Init](ride_init.md). 

For example, `3502⌶'SERVE:*:4502'` configures the interpreter to accept incoming RIDE connections from any machine on port 4502, and then enables the RIDE with that configuration.if `R` is `0`, then the RIDE was disabledif `R` is `¯2`, then the RIDE was active
- if `R` is `0`, then the RIDE was disabled
- if `R` is `¯2`, then the RIDE was active

On a run-time interpreter, `3502⌶1` is the only way to enable the RIDE.

If the RIDE_INIT configuration parameter is set but the RIDE DLLs/shared libraries are not available, then a run-time interpreter will start but the subsequent call to `3502⌶` will be unsuccessful.

## Configuration Parameters

Some customisation can be performed using configuration parameters outside a Session. For details of other configuration parameters that can be set, and the syntax used to set them, see the Dyalog for `<operating system> Installation and Configuration Guide` specific to the operating system that you are using.

Changes made to configuration parameters in the dyalog.config file only impact local interpreters (that is, interpreters that are configured by that file) and do not impact interpreters that the RIDE can connect with on other machines.

### RIDE_EDITOR

This configuration parameter specifies the fully-qualified path to the executable of the editor to use in a Dyalog Session instead of the RIDE's built-in editor (for example, vim, Emacs or Notepad++).

### RIDE_INIT

This configuration parameter specifies how
How the interpreter should behave with respect to the RIDE protocol. Setting this configuration parameter on the machine that hosts the interpreter enables the interpreter-RIDE connection.

The format of the value is `{mode:setting}[,mode:setting]`

where `mode` is the action that the interpreter should take and determines the content of the `setting`. Valid (case-insensitive) values are:

- `SERVE` – listen for incoming connections from the RIDE client
- `CONNECT` – attempt to connect to the specified RIDE client and end the session if this fails
- `POLL` – attempt to connect to the specified RIDE client at regular intervals and reconnect if the connection is lost
- `HTTP` – listen for incoming connections from the web browser, via [zero footprint RIDE](the_zero_footprint_ride.md#))
- `CONFIG` – retrieve values to use from a .ini [configuration file](configuration_ini_file.md)

If two modes are specified, then:

- one of the modes must be `CONFIG`.
- the `SERVE`/`CONNECT`/`POLL`/`HTTP` values always override the equivalent values in the .ini configuration file.

If `mode` is `SERVE` or `HTTP`, then `setting` is `address:port`, where:

- `address` is the address of the interface on which the machine running the APL process should listen (that is, the address of the machine that is running the interpreter). 

Valid values are: 

- <empty> – listen on all loopback interfaces, that is, the interpreter only accepts connection from the local machine
- `*` – listen on all local machine interfaces, that is, the interpreter listens for connections from any (local or remote) machine/interface
- the host/DNS name of the machine/interface running the interpreter – listen on that specific interface on the local machine
- the IPv4 address of the machine/interface running the interpreter – listen on that specific interface on the local machine
- the IPv6 address of the machine/interface running the interpreter – listen on that specific interface on the local machine
- `port` is the TCP port to listen on

If `mode` is `CONNECT` or `POLL`, then `setting` is `address:port`, where:

- `address` is the destination address to attempt to connect to (the machine/interface running the RIDE client). Valid values are:the host/DNS name of a machine/interface running the RIDE clientthe IPv4 address of a machine/interface running the RIDE clientthe IPv6 address of a machine/interface running the RIDE client
- the host/DNS name of a machine/interface running the RIDE client
- the IPv4 address of a machine/interface running the RIDE client
- the IPv6 address of a machine/interface running the RIDE client
- `port` is the TCP port to connect to

If `mode` is `CONFIG`, then `setting` is `filename`, where:

- `filename` is the fully-qualified path to, and name of, a .ini configuration file containing name-value pairs related to mode, certificate details, and so on. The default value for `setting` is `ride.ini` (for more information on the .ini configuration file, see [here](configuration_ini_file.md)).

Examples

To listen on port 4502 for connection requests from a RIDE client running on any machine: `RIDE_INIT=SERVE:*:4502`

To attempt to connect to a RIDE client running on a different machine (with IPv4 address 10.0.38.1 and listening on port 4502) and end the Session if unable to do so:`RIDE_INIT=CONNECT:10.0.38.1:4502`

To establish a connection using the settings in the ride_sample.ini file:`RIDE_INIT=CONFIG:C:/tmp/ride_sample.ini`

To attempt to establish a secure connection with a RIDE client running on a different machine (with IPv4 address 10.0.38.1 and listening on port 4502) using certificate details specified in the ride_sample.ini file:`RIDE_INIT=CONFIG:C:\tmp\ride_sample.ini,CONNECT:10.0.38.1:4502`or`RIDE_INIT=CONNECT:10.0.38.1:4502,CONFIG:C:\tmp\ride_sample.ini`

With Dyalog and the RIDE installed on a machine with IPv4 address 10.0.38.1, to listen on port 4502 for connection requests from a web browser running on any machine (Zero Footprint RIDE – see [Section ](the_zero_footprint_ride.md#)):`RIDE_INIT=HTTP:*:4502`To open the Zero Footprint RIDE in a web browser on:

- the local machine : URL = http://localhost:4502
- a different machine: URL = http://10.0.38.1:4502

The `RIDE_INI` configuration parameter is set automatically when launching a new Dyalog Session from the RIDE (see [Start](type_start.md)).

If the `RIDE_INIT` configuration parameter is set but the RIDE DLLs/shared libraries are not available, then a run-time interpreter will start but the subsequent call to `3502⌶` will be unsuccessful – see [3502⌶](3502_ibeam_ride.md).











