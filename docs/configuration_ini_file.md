



## Configuration (.ini) File


A .ini configuration file can be used to define settings for the RIDE_INIT configuration parameter. By default, the interpreter will look for a ride.ini file in:

-  the directory in which the default session and log files are stored, for example, C:\Users\JohnDoe\AppData\Local\Programs\Dyalog\ (on Microsoft Windows)
-  $HOME/.dyalog/ (on IBM AIX, macOS and Linux)

This file is not automatically created by Dyalog but can be created manually. Examples of the fields that you might want to include within the .ini configuration file are included in [Appendix 1](sample_configuration_file.md).


A different name and location for the .ini configuration file can be specified by including a second `mode`, `CONFIG`, in the RIDE_INIT parameter (see [Section 1.0.1](ride_init.md#)) and setting it so that `CONFIG=<filename>`, where `<filename>` is the fully-qualified path to, and name of, a .ini configuration file containing name-value pairs related to mode, certificate details, and so on.

The .ini configuration file must be located on the machine on which the interpreter is running (this is not necessarily the same machine as the one on which the RIDE is running).

