# Ride in the browser

Dyalog can serve Ride to any modern web browser – this is known as "zero-footprint" operation since Ride is not installed on the client machine but is downloaded by the web browser on demand. The advantage is that an APL session can be monitored and maintained from any device without installing anything.

This mode has the following limitations:

- You can only interact with the APL interpreter that is serving you; the **New Session** window is not available.
- Preferences are persisted in browser storage using cookies.
- Window captions cannot be controlled.
- The floating **Trace/Edit** windows option is not available.

## Accessing Zero-Footprint Ride from a browser

1. If Dyalog is running on Windows, [install zero-footprint Ride](installation.md/#windows)
2. Set the `RIDE_INIT` configuration parameter to `HTTP:address:port` (see [Ride Init](ridespecific_language_features.md/#ride_init)), for example, `RIDE_INIT=HTTP:*:8080`.
3. Start a Dyalog session.
4. Navigate to `http://<address>:<port>`, for example, `http://10.0.38.1:8080`.

If Dyalog is running on non-Windows platforms, the interpreter expects to find zero-footprint Ride installed at the `[DYALOG]/RIDEapp` directory; this removes the need to include the `HTTPDIR` field in a [configuration file](installation.md#configuration-ini-file).
