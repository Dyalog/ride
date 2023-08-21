



### 3502⌶ (Manage RIDE Connectors)



By default, the RIDE is not enabled on run-time executables. For security reasons, enabling the RIDE is a two-step process rather than using (for example) a single configuration parameter. To enable the RIDE, two steps must be taken:

1. Set the RIDE_INIT configuration parameter (see [Section ](ride_init.md#)) on the machine on which the run-time interpreter is running to an appropriate value.
2. Execute `3502⌶1` in your application code.

The run time interpreter can then attempt to connect to a RIDE client.


Enabling the RIDE to access applications that use the run-time interpreter means that the APL code of those applications can be accessed. The I-beam mechanism described above means that the APL code itself must grant the right for a RIDE client to connect to the run time interpreter. Although Dyalog Ltd might change the details of this mechanism, the APL code will always need to grant connection rights. In particular, no mechanism that is only dependent on configuration parameters will be implemented.



Syntax: `R←3502⌶Y`


`R` is `0` if the call is successful, otherwise an integer (positive or negative) is returned.


`Y` can be any of the following possible values:

- `0` : disable any active RIDE connections.`R` is always `0`
- `R` is always `0`
- `1` : enable the RIDE using the initialisation string defined in the RIDE_INIT configuration parameter  (see [Section 1.0.1](ride_init.md#)):if `R` is `0`, then the RIDE was disabled and is now successfully enabledif `R` is `¯1`, then the RIDE was already activeif `R` is `32`, then the RIDE DLL/shared library is not availableif `R` is `64`, then the RIDE_INIT configuration parameter is not correctly defined
- if `R` is `0`, then the RIDE was disabled and is now successfully enabled
- if `R` is `¯1`, then the RIDE was already active
- if `R` is `32`, then the RIDE DLL/shared library is not available
- if `R` is `64`, then the RIDE_INIT configuration parameter is not correctly defined
- a simple character vector : replace the RIDE_INIT configuration parameter with the specified initialisation string, which should be in the format specified in [Section ](ride_init.md#). For example, `3502⌶'SERVE:*:4502'` configures the interpreter to accept incoming RIDE connections from any machine on port 4502, and then enables the RIDE with that configuration.if `R` is `0`, then the RIDE was disabledif `R` is `¯2`, then the RIDE was active
- if `R` is `0`, then the RIDE was disabled
- if `R` is `¯2`, then the RIDE was active


On a run-time interpreter, `3502⌶1` is the only way to enable the RIDE.


If the RIDE_INIT configuration parameter is set but the RIDE DLLs/shared libraries are not available, then a run-time interpreter will start but the subsequent call to `3502⌶` will be unsuccessful.



