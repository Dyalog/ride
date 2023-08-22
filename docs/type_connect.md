



#### Type: Connect


The RIDE connects to a specific running (local or remote) Dyalog interpreter that is listening for connections. This is typically used when the RIDE is monitoring processes that have been started to provide some kind of service and to debug them if something unexpected happens.



You should only configure a Dyalog interpreter to listen for connections if either of the following apply:

- you have a firewall that allows you specify which client machines will be able to connect
- you use a configuration file (see [Appendix ](sample_configuration_file.md#)) to specify suitable security filters to limit access to the interpreter.

Your application can use `3502⌶` to enable debugging when it is appropriate (see [Section ](3502_ibeam_ride.md#)).


To safely experiment with configuring APL to listen for connections, leave the address field in the following examples empty, for example, `RIDE_INIT="SERVE::4502"`. If the address field is empty, then only local connections are allowed. The `*` used below instructs the interpreter to listen on all available network adapters.



To start a Dyalog Session

1. On the machine that the interpreter will run on, start a Dyalog Session, optionally specifying an IP address/DNS name and port that it will listen for RIDE connections on using the RIDE_INIT configuration parameter. If specified, this will override any RIDE_INIT values defined in a configuration file (see [Section 1.1](configuration_ini_file.md#)).
2. On the machine that the RIDE is running on:Open the RIDE-Dyalog Session dialog box.Select Connect from the Type drop-down list.Optionally, check Save protocol log – this  records all communications between the interpreter and the RIDE. The default path/filename for this interpreter‑independent protocol log can be changed.Select a security protocol from the drop-down list.
The type-dependent information fields are displayed.
- If the security protocol is set to TCP:Host: the IP address/unique DNS name of the machine that the interpreter is running on.Port: the number of the port that the interpreter is listening on. By default, the interpreter listens on port 4502.
- Host: the IP address/unique DNS name of the machine that the interpreter is running on.
- Port: the number of the port that the interpreter is listening on. By default, the interpreter listens on port 4502.
- If the security protocol is set to SSH then the RIDE connects to a remote interpreter using the secure shell network protocol:
- Host: the IP address/unique DNS name of the machine that the interpreter is running on.
- Port: the number of the port that the interpreter is listening on. By default, the interpreter listens on port 4502.
- SSH Port: the number of the port to use for SSH. The default is 22.
- User: the user name on the machine that the interpreter is running on.
- Key file: the fully-qualified filename of the SSH identity file.
- Password/passphrase: either the password corresponding to the specified User or, if an encrypted key file is being used for authentication, the passphrase.If an encrypted Key File is specified, a passphrase is required for authentication.If an unencrypted Key File is specified, a password/passphrase is not required.If a Key File is not specified, then the password corresponding to the specified User is required.
- If an encrypted Key File is specified, a passphrase is required for authentication.
- If an unencrypted Key File is specified, a password/passphrase is not required.
- If a Key File is not specified, then the password corresponding to the specified User is required.
- If the security protocol is set to TLS/SSL then secure connections are enabled:
- Host: the IP address/unique DNS name of the machine that the interpreter is running on.
- Port: the number of the port that the interpreter is listening on. By default, the interpreter listens on port 4502.
- Three optional check boxes (and associated fields) are relevant if you have not added your root certificate to the Microsoft Certificate Store or are not running on the Microsoft Windows operating system:Provide user certificate: if selected, populate the Cert and Key fields with the fully-qualified paths to, and names of, the PEM encoded certificate file and key file respectively – the interpreter (RIDE server) uses this to verify that the RIDE client is permitted to connect to it.Custom root certificates: if selected, populate the Directory field with the fully-qualified path to, and name of, the directory that contains multiple root certificates and key files to use for authentication.Validate server subject common name matches hostname: verifies that the CN (Common Name) field of the server's certificate matches the hostname.
- Provide user certificate: if selected, populate the Cert and Key fields with the fully-qualified paths to, and names of, the PEM encoded certificate file and key file respectively – the interpreter (RIDE server) uses this to verify that the RIDE client is permitted to connect to it.
- Custom root certificates: if selected, populate the Directory field with the fully-qualified path to, and name of, the directory that contains multiple root certificates and key files to use for authentication.
- Validate server subject common name matches hostname: verifies that the CN (Common Name) field of the server's certificate matches the hostname.Click CONNECT.
3. Open the RIDE-Dyalog Session dialog box.
4. Select Connect from the Type drop-down list.
5. Optionally, check Save protocol log – this  records all communications between the interpreter and the RIDE. The default path/filename for this interpreter‑independent protocol log can be changed.
6. Select a security protocol from the drop-down list.
7. Click CONNECT.




