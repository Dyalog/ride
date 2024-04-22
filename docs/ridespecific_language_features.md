# RIDE-Specific Language Features

When running a Dyalog Session through RIDE, the majority of language features remain unaltered. However, there are a few additional features (see [I-beams](#i-beams) and [RIDE-Specific Configuration Parameters](#configuration-parameters)) and some existing functionality that is meaningless (see [Unsupported Language Elements](#unsupported_language_elements)) when a Session is running through RIDE.

## I-Beams

I-Beam is a monadic operator that provides a range of system-related services.

**Syntax**: `R←{X}(A⌶)Y`

!!!warning
    Any service provided using an I-Beam should be considered as experimental and subject to change – without notice – from one release to the next. Any use of I-Beams in applications should, therefore, be carefully isolated in cover-functions that can be adjusted if necessary.

There are three I-Beams that are only relevant to RIDE. Consult the main Dyalog documentation for details: 

* [3500⌶ (Send HTML to RIDE)](https://help.dyalog.com/latest/index.htm#Language/I%20Beam%20Functions/Send%20Text%20to%20RIDE-embedded%20Browser.htm?Highlight=3500%E2%8C%B6)
* [3501⌶ (Connected to RIDE?)](https://help.dyalog.com/latest/index.htm#Language/I%20Beam%20Functions/Connected%20to%20the%20RIDE.htm?Highlight=3501%E2%8C%B6)
* [3502⌶ (Manage RIDE Connectors)](https://help.dyalog.com/latest/index.htm#Language/I%20Beam%20Functions/Manage%20RIDE%20Connections.htm?Highlight=3502%E2%8C%B6).


!!!note "Microsoft Windows"
    By default, RIDE is not enabled on run-time executables. For security reasons, enabling RIDE is a two-step process rather than using (for example) a single configuration parameter. To enable RIDE, two steps must be taken:

    1. Set the `RIDE_INIT` configuration parameter (see [RIDE_INIT](#ride_init)) on the machine on which the run-time interpreter is running to an appropriate value.
    2. Execute `3502⌶1` in your application code.

    The run time interpreter can then attempt to connect to a RIDE client.

    Enabling RIDE to access applications that use the run-time interpreter means that the APL code of those applications can be accessed. The I-beam mechanism described above means that the APL code itself must grant the right for a RIDE client to connect to the run time interpreter. Although Dyalog Ltd might change the details of this mechanism, the APL code will always need to grant connection rights. In particular, no mechanism that is only dependent on configuration parameters will be implemented.

For example, `R ← 3502⌶'SERVE:*:4502'` configures the interpreter to accept incoming RIDE connections from any machine on port 4502, and then enables RIDE with that configuration.

- if `R` is `0`, then RIDE was disabled
- if `R` is `¯2`, then RIDE was active

On a run-time interpreter, `3502⌶1` is the only way to enable RIDE.

If the `RIDE_INIT` configuration parameter is set but RIDE DLLs/shared libraries are not available, then a run-time interpreter will start but the subsequent call to `3502⌶` will be unsuccessful.

## Configuration Parameters

Some customisation can be performed using configuration parameters outside a Session. For details of other configuration parameters that can be set, and the syntax used to set them, see the Dyalog Installation and Configuration Guide specific to the operating system that you are using:

- [macOS Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20macOS%20Installation%20and%20Configuration%20Guide.pdf)
- [Microsoft Windows Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20Microsoft%20Windows%20Installation%20and%20Configuration%20Guide.pdf)
- [UNIX Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20UNIX%20Installation%20and%20Configuration%20Guide.pdf)

Changes made to configuration parameters in the `dyalog.config` file only impact local interpreters (that is, interpreters that are configured by that file) and do not impact interpreters that RIDE can connect with on other machines.

### RIDE_EDITOR

This configuration parameter specifies the fully-qualified path to the executable of the editor to use in a Dyalog Session instead of RIDE's built-in editor (for example, vim, Emacs or Notepad++).

### RIDE_INIT

This configuration parameter specifies how the interpreter should behave with respect to the RIDE protocol. Setting this configuration parameter on the machine that hosts the interpreter enables the interpreter-RIDE connection.

The format of the value is `{mode:setting}[,mode:setting]`

where `mode` is the action that the interpreter should take and determines the content of the `setting`. Valid (case-insensitive) values are:

- `SERVE` – listen for incoming connections from a RIDE client
- `CONNECT` – attempt to connect to the specified RIDE client and end the session if this fails
- `POLL` – attempt to connect to the specified RIDE client at regular intervals and reconnect if the connection is lost
- `HTTP` – listen for incoming connections from the web browser, via [Zero Footprint RIDE](ride_in_the_browser.md)
- `CONFIG` – retrieve values to use from a .ini [configuration file](installation.md/#configuration-ini-file)

!!!note
    If two modes are specified, then:

    - one of the modes must be `CONFIG`.
    - the `SERVE`/`CONNECT`/`POLL`/`HTTP` values always override the equivalent values in the **.ini** configuration file.

If `mode` is `SERVE` or `HTTP`, then `setting` is `address:port`, where:

- `address` is the address of the interface on which the machine running the APL process should listen (that is, the address of the machine that is running the interpreter). Valid values are: 

    - `<empty>` – listen on all loopback interfaces, that is, the interpreter only accepts connection from the local machine
    - `*` – listen on all local machine interfaces, that is, the interpreter listens for connections from any (local or remote) machine/interface
    - the host/DNS name of the machine/interface running the interpreter – listen on that specific interface on the local machine
    - the IPv4 address of the machine/interface running the interpreter – listen on that specific interface on the local machine
    - the IPv6 address of the machine/interface running the interpreter – listen on that specific interface on the local machine

- `port` is the TCP port to listen on

If `mode` is `CONNECT` or `POLL`, then `setting` is `address:port`, where:

- `address` is the destination address to attempt to connect to (the machine/interface running RIDE client). Valid values are:
    - the host/DNS name of a machine/interface running RIDE client
    - the IPv4 address of a machine/interface running RIDE client
    - the IPv6 address of a machine/interface running RIDE client

- `port` is the TCP port to connect to

If `mode` is `CONFIG`, then `setting` is `filename`, where:

- `filename` is the fully-qualified path to, and name of, a **.ini** configuration file containing name-value pairs related to mode, certificate details, and so on. The default value for `setting` is `ride.ini`.

**Examples**

To listen on port 4502 for connection requests from a RIDE client running on any machine: `RIDE_INIT=SERVE:*:4502`

To attempt to connect to a RIDE client running on a different machine (with IPv4 address 10.0.38.1 and listening on port 4502) and end the Session if unable to do so: `RIDE_INIT=CONNECT:10.0.38.1:4502`

To establish a connection using the settings in the ride_sample.ini file:`RIDE_INIT=CONFIG:C:/tmp/ride_sample.ini`

To attempt to establish a secure connection with a RIDE client running on a different machine (with IPv4 address 10.0.38.1 and listening on port 4502) using certificate details specified in the ride_sample.ini file: `RIDE_INIT=CONFIG:C:\tmp\ride_sample.ini,CONNECT:10.0.38.1:4502` or `RIDE_INIT=CONNECT:10.0.38.1:4502,CONFIG:C:\tmp\ride_sample.ini`

With Dyalog and RIDE installed on a machine with IPv4 address 10.0.38.1, to listen on port 4502 for connection requests from a web browser running on any machine ([RIDE in the browser](ride_in_the_browser.md)): `RIDE_INIT=HTTP:*:4502`

To open the Zero Footprint RIDE in a web browser on:

- the local machine: URL = `http://localhost:4502`
- a different machine: URL = `http://10.0.38.1:4502`

The `RIDE_INI` configuration parameter is set automatically when launching a new Dyalog Session from RIDE.

!!!note
    If the `RIDE_INIT` configuration parameter is set but RIDE DLLs/shared libraries are not available, then a run-time interpreter will start but the subsequent call to `3502⌶` will be unsuccessful – see [3502⌶](https://help.dyalog.com/latest/index.htm#Language/I%20Beam%20Functions/Manage%20RIDE%20Connections.htm?Highlight=3502%E2%8C%B6).

## Unsupported Language Elements

When running a Dyalog Session through RIDE, a few of the features that are available with non-RIDE Sessions do not function as might be expected.

### Underscored Characters

Underscored characters can be entered into the Session window and **Edit** windows using the ``` ``_ <letter>``` method (two backticks, followed by an underscore and a letter), for example, type ``` ``_ F``` to produce <u>F</u>.

#### Underscored Characters in Window Captions

RIDE is restricted by the operating system when it comes to displaying underscored characters in window titles (captions). This restriction means that underscored characters can be displayed as circled characters, white rectangles, or black lozenges containing a question mark. Tab captions use the APL font, so they will display underscored characters correctly.

#### Underscored Characters in the Session

If RIDE is connected to a Unicode edition of Dyalog, then underscored characters are displayed correctly in the **Session** window, **Edit** windows and **Trace** windows. If RIDE is connected to a classic edition of Dyalog, then the following command must be run in every APL Session to enable the underscored alphabet to be displayed correctly:
```apl
      ⎕IO←0
      ⎕AVU[97+⍳26]←9398+⍳2      
      2 ⎕NQ '.' 'SetUnicodeTable' ⎕AVU
```

### Function Key Configuration

Character strings (including command keys) can be associated with programmable function keys using the [⎕PFKEY](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/pfkey.htm) system function. When running a Dyalog Session through RIDE, `⎕PFKEY` can be used to define/display the keystrokes for a designated function key; however, that function key does not acquire the defined set of keystrokes, rendering `⎕PFKEY` of no real use. Instead, function keys should be set through the Shortcuts tab of the Preferences dialog box.

### Operating System Terminal/Command Window Interaction

Features that rely on interaction with an operating system terminal/command window (that is, [⎕SR](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/sr.htm) and [)SH](https://help.dyalog.com/latest/index.htm#Language/System%20Commands/sh.htm) or [)CMD](https://help.dyalog.com/latest/index.htm#Language/System%20Commands/cmd.htm) with no argument) cannot work in a Dyalog Session that is running through RIDE. Instead of behaving as documented in the [Dyalog APL Language Reference Guide](https://docs.dyalog.com/latest/Dyalog%20APL%20Language%20Reference%20Guide.pdf), their behaviour depends on the way in which the interpreter and RIDE combined to start a Dyalog Session:

- If the interpreter was started by RIDE, then:
    - `⎕SR` generates a trappable error
    - `)SH` or `)CMD` with no argument produces a "Feature disabled in this environment" message.

- If the interpreter and RIDE were started independently and then connected to each other, then the use of these features will appear to hang the Dyalog Session that is running through RIDE. However, the Dyalog Session can be recovered by locating the operating system terminal/command window and using it to complete the operation. If there is no operating system terminal/command window, then the Dyalog Session is irrecoverable.
