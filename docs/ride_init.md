



### RIDE_INIT


This configuration parameter specifies how
How the interpreter should behave with respect to the RIDE protocol. Setting this configuration parameter on the machine that hosts the interpreter enables the interpreter-RIDE connection.


The format of the value is `{mode:setting}[,mode:setting]`


where `mode` is the action that the interpreter should take and determines the content of the `setting`. Valid (case-insensitive) values are:

- `SERVE` – listen for incoming connections from the RIDE client
- `CONNECT` – attempt to connect to the specified RIDE client and end the session if this fails
- `POLL` – attempt to connect to the specified RIDE client at regular intervals and reconnect if the connection is lost
- `HTTP` – listen for incoming connections from the web browser (zero footprint RIDE – see [Section ](the_zero_footprint_ride.md#))
- `CONFIG` – retrieve values to use from a .ini configuration file (see [Section 1.1](configuration_ini_file.md#))


If two modes are specified, then:

- one of the modes must be `CONFIG`.
- the `SERVE`/`CONNECT`/`POLL`/`HTTP` values always override the equivalent values in the .ini configuration file.


If `mode` is `SERVE` or `HTTP`, then `setting` is `address:port`, where:

- `address` is the address of the interface on which the machine running the APL process should listen (that is, the address of the machine that is running the interpreter). Valid values are:<empty> – listen on all loopback interfaces, that is, the interpreter only accepts connection from the local machine`*` – listen on all local machine interfaces, that is, the interpreter listens for connections from any (local or remote) machine/interfacethe host/DNS name of the machine/interface running the interpreter – listen on that specific interface on the local machinethe IPv4 address of the machine/interface running the interpreter – listen on that specific interface on the local machinethe IPv6 address of the machine/interface running the interpreter – listen on that specific interface on the local machine
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

- `filename` is the fully-qualified path to, and name of, a .ini configuration file containing name-value pairs related to mode, certificate details, and so on. The default value for `setting` is `ride.ini` (for more information on the .ini configuration file, see [Section 1.1](configuration_ini_file.md#)).

Examples


To listen on port 4502 for connection requests from a RIDE client running on any machine:`RIDE_INIT=SERVE:*:4502`


To attempt to connect to a RIDE client running on a different machine (with IPv4 address 10.0.38.1 and listening on port 4502) and end the Session if unable to do so:`RIDE_INIT=CONNECT:10.0.38.1:4502`


To establish a connection using the settings in the ride_sample.ini file:`RIDE_INIT=CONFIG:C:/tmp/ride_sample.ini`


To attempt to establish a secure connection with a RIDE client running on a different machine (with IPv4 address 10.0.38.1 and listening on port 4502) using certificate details specified in the ride_sample.ini file:`RIDE_INIT=CONFIG:C:\tmp\ride_sample.ini,CONNECT:10.0.38.1:4502`or`RIDE_INIT=CONNECT:10.0.38.1:4502,CONFIG:C:\tmp\ride_sample.ini`


With Dyalog and the RIDE installed on a machine with IPv4 address 10.0.38.1, to listen on port 4502 for connection requests from a web browser running on any machine (Zero Footprint RIDE – see [Section ](the_zero_footprint_ride.md#)):`RIDE_INIT=HTTP:*:4502`To open the Zero Footprint RIDE in a web browser on:

- the local machine : URL = http://localhost:4502
- a different machine: URL = http://10.0.38.1:4502




The RIDE_INIT configuration parameter is set automatically when launching a new Dyalog Session from the RIDE (see [Section ](type_start.md#)).

If the RIDE_INIT configuration parameter is set but the RIDE DLLs/shared libraries are not available, then a run-time interpreter will start but the subsequent call to `3502⌶` will be unsuccessful – see [Section ](3502_ibeam_ride.md#).

