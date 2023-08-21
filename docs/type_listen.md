



#### Type: Listen


The RIDE waits for a local or remote interpreter to connect to it. This approach is more secure than configuring the interpreter to listen for connections, because an intruder will only be able to communicate with the RIDE rather than an APL system. An application that needs to be debugged can initiate the connection to a listening RIDE using `3502⌶` to set RIDE_INIT when debugging is desired (see [Section ](3502_ibeam_ride.md#)).


To start a Dyalog Session

1. On the machine that the RIDE is running on:Open the RIDE-Dyalog Session dialog box.Select Listen from the Type drop down list.
The type-dependent information fields are displayed.In the Host field, specify the IP address/unique DNS name that the RIDE will bind to. By default, the RIDE will bind to all interfaces.In the Port field, specify the number of the port that the RIDE should listen on. By default, the RIDE listens on port 4502.
Optionally, check Save protocol log – this  records all communications between the interpreter and the RIDE. The default path/filename for this interpreter‑independent protocol log can be changed.Click LISTEN.
The Waiting for connection... dialog box is displayed.

2. Open the RIDE-Dyalog Session dialog box.
3. Select Listen from the Type drop down list.
4. Optionally, check Save protocol log – this  records all communications between the interpreter and the RIDE. The default path/filename for this interpreter‑independent protocol log can be changed.
5. Click LISTEN.
6. On the machine that the interpreter will run on, start a Dyalog Session from the command prompt. When doing this, the IP address/DNS name for the machine that the RIDE is running on and the same port number as the RIDE is listening on must be specified as connection properties.
For example, if the RIDE is running on a machine that has DNS name jaypc.dyalog.bramley and is listening on port 4502, then enter the following in a command window/at the command prompt:on AIX:`$ RIDE_INIT="CONNECT:jaypc.dyalog.bramley:4502" /opt/mdyalog/16.0/64/unicode/p7/mapl`on Linux:`$ RIDE_INIT="CONNECT:jaypc.dyalog.bramley:4502" dyalog`on macOS:`$ RIDE_INIT="CONNECT:jaypc.dyalog.bramley:4502" /Dyalog/Dyalog-16.0.app/Contents/Resources/Dyalog/mapl`on Microsoft Windows:`> cd "C:\Program Files\Dyalog\Dyalog APL-64 16.0 Unicode" > dyalog RIDE_INIT=CONNECT:jaypc.dyalog.bramley:4502`

The Dyalog Session starts.





Alternatively, start a Dyalog Session and enter:


`3502⌶'CONNECT:jaypc.dyalog.bramley:4502' 3502⌶1`


The new Dyalog Session will connect to the RIDE and remain connected until the Dyalog Session is terminated.


            On Microsoft Windows, an alternative to using the command window is to create a shortcut with the appropriate settings.
            
To configure the shortcut
1. Select the appropriate Dyalog installation and create a shortcut to it.
2. Right-click on the shortcut icon and select Properties from the context menu that is displayed.
3. In the Shortcut tab, go to the Target field and:place " marks around the pathappend `RIDE_INIT=CONNECT:10.0.38.1:4502`
4. place " marks around the path
5. append `RIDE_INIT=CONNECT:10.0.38.1:4502`
6. Click OK.



