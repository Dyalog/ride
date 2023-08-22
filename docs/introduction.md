# Introduction

!!!note
    The use of the RIDE is subject to the conditions of the [MIT licence](https://github.com/Dyalog/ride/blob/master/licence). The installation and use of the RIDE does not convey any additional rights to use Dyalog or any other Dyalog products. Specifically, although the interpreter can be configured to allow the RIDE to debug runtime executables, you should only do this if your Dyalog licence also allows it.

The Remote Integrated Development Environment (RIDE) is a cross-platform, graphical development environment capable of producing a rich user experience on a variety of platforms. It supports the interactive use of APL notation to explore data, discover algorithms and create solutions – or diagnose problems, resolve issues and resume the execution of running applications.

The RIDE runs separately from the APL interpreter, and communicates with it using TCP/IP sockets. The RIDE can be run on macOS, Microsoft Windows and Linux (including the Raspberry Pi). In addition to being used as a front end for APL running locally, it can also be used to launch APL sessions on remote machines or to connect to APL interpreters that are already running – either locally or remotely.

From Dyalog version 17.0, the interpreter can easily be configured to act as a web server which provides the RIDE application as a web page. This makes it possible to run the RIDE in a browser on any platform, without installing it locally. The RIDE needs to be installed on the machine where the interpreter is running, so the files can be provided as a webpage. Because no client-side installation is necessary, this mode is known as Zero Footprint.

The RIDE has two main modes of use:

- Providing a user interface to an interpreter engine (local or remote).
- As a tool for managing connections to a collection of interpreter sessions.

