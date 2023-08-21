## TLS Flags

TLS flags are employed as part of the certificate checking process; they determine whether a secure client or server can connect with a peer that does not have a valid certificate. When `Direction` is `Connect` or `Poll`, the RIDE acts as a server; when `Direction` is `Serve`, the RIDE acts as a client.

The code numbers of the TLS flags described below can be added together and passed to the `SSLValidation` field to control the certificate checking process. If you do not require any of these flags, then the `SSLValidation` field should be set to `0`.

| Code | Name | Description |
| --- | --- | --- |
| 1 | CertAcceptIfIssuerUnknown | Accept the peer certificate even if the issuer (root certificate) cannot be found. |
| 2 | CertAcceptIfSignerNotCA | Accept the peer certificate even if it has been signed by a certificate not in the trusted root certificates' directory. |
| 4 | CertAcceptIfNotActivated | Accept the peer certificate even if it is not yet valid (according to its valid from information). |
| 8 | CertAcceptIfExpired | Accept the peer certificate even if it has expired (according to its valid to information). |
| 16 | CertAcceptIfIncorrectHostName | Accept the peer certificate even if its hostname does not match the one it was trying to connect to. |
| 32 | CertAcceptWithoutValidating | Accept the peer certificate without checking it (useful if the certificate is to be checked manually). |
| 64 | RequestClientCertificate | Only valid when the RIDE is acting as a server; asks the client for a certificate but allows connections even if the client does not provide one. |
| 128 | RequireClientCertificate | Only valid when the RIDE is acting as a server; asks the client for a certificate and refuses the connection if a valid certificate (subject to any other flags) is not provided by the client. |

TLS flags have the same meaning irrespective of whether the RIDE is acting as a server or a client. However, for a server they are applied each time a new connection is established whereas for a client they are only applied when the client object is created.
