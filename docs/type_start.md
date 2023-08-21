



#### Type: Start


The most common use of the RIDE is where the RIDE launches an APL interpreter process and connects to it. The RIDE allocates a random TCP port and instructs the launched interpreter to connect to it immediately. The RIDE is also able to launch remote processes on machines that support Secure Shell (SSH) logins, in which case the communication between the RIDE and the interpreter is also encrypted.


To start a Dyalog Session

1. Open the RIDE-Dyalog Session dialog box.
2. Select Start from the Type drop-down list.
3. Optionally, check Save protocol log – this  records all communications between the interpreter and the RIDE. The default path/filename for this interpreter‑independent protocol log can be changed.
4. Select a security protocol from the drop-down list.
5. Click START.



In the Dyalog Session, selecting New Session in the File menu (see [Section ](file_menu.md#)) launches another instance of the interpreter whose path is specified in the path to executable field.

