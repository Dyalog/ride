



## The Zero Footprint RIDE


The RIDE is an application that is implemented using a combination of HTML and Javascript. A full RIDE installation includes a small web server framework called Node/JS, which acts as a host for the application, and an embedded web browser that renders it to the user as a desktop application.


Dyalog is able to act as a web server, hosting the RIDE application and making it available to any compatible web browser – this is known as "Zero Footprint" operation as the RIDE is not installed on the client machine but is downloaded by the web browser on demand. The advantage of the Zero Footprint RIDE is that an APL session can be monitored and maintained from any device with a suitable browser installed; no installation of RIDE is required.


The Zero Footprint RIDE provides the same features for viewing and developing APL code as the desktop RIDE, with the following limitations:

- The Zero Footprint RIDE can only interact with the APL interpreter that it is connected to; none of the functionality related to launching new sessions or connecting to running APL sessions is available.
- Preferences are persisted in browser storage using cookies.
- Behaviour that is provided by the browser (undo/redo, cut/copy/paste, change font size) does not appear in the RIDE's menus.
- Window captions cannot be controlled.

To make the Zero Footprint RIDE available from a web browser

1. Install Dyalog and the RIDE. These must both be installed on the same machine; the RIDE must be installed in its default location. On non-Windows platforms the Zero Footprint RIDE is automatically installed when Dyalog is installed. For information on installing the RIDE on Microsoft Windows, see  [Section .](installing_on_windows.md#)
2. Set the RIDE_INIT configuration parameter to `HTTP:address:port` (see [Section ](ride_init.md#)), for example, `RIDE_INIT=HTTP:*:8080`.
3. Start a Dyalog session.




On non-Windows platforms (IBM AIX, macOS and Linux), the interpreter expects to find the Zero Footprint RIDE files in the [DYALOG]/RIDEapp directory; this removes the need to include the `HttpDir` field in a configuration file (if one is used – see [Section 1.1](configuration_ini_file.md#)).


