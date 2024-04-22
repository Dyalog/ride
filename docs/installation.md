# Installation


!!!note
    RIDE is built on the [Electron](https://www.electronjs.org/) framework. To install this version of RIDE, your platform must support the Electron major release 26. Consult Electron's [platform support documentation](https://github.com/electron/electron/tree/26-x-y?tab=readme-ov-file#platform-support) if in any doubt.

    This version of RIDE can connect to version 15.0 or later of the Dyalog interpreter.

## Font and Keyboard Support

If Dyalog is not installed on the machine that RIDE is being installed on, then the APL385 Unicode font and keyboard mappings installed with RIDE mean that they are available within RIDE. However, to be able to enter APL glyphs outside RIDE, see [APL Fonts and Keyboards](https://www.dyalog.com/apl-font-keyboard.htm).

## RIDE in the Browser

The use of RIDE from a browser requires no installation on the machine where RIDE will run; all you need is a  modern browser. This is known as "zero-footprint RIDE".

!!!note
    When installing RIDE, if you select the default location suggested by the installer then APL can be launched as a RIDE server without creating a [configuration file](sample_configuration_file.md).

On non-Windows platforms, zero-footprint RIDE is automatically installed to the default location (**[DYALOG]/RIDEapp**) when Dyalog is installed and no additional installation is necessary. On Windows, zero-footprint RIDE needs separate installation.

For details, see [RIDE in the browser](ride_in_the_browser.md).

## Linux

RIDE requires Debian 8, Fedora 24.04, or Ubuntu 14.04 (or later). Distributions built on top of the above should also work, provided that they have libnss version 3.26 or newer.

1. Download the **.deb** or **.rpm** file (whichever is appropriate for your Linux distribution) from the [RIDE releases page](https://github.com/Dyalog/ride/releases). If your Linux distribution does not support either **.deb** or **.rpm** files, then please contact support@dyalog.com.
2. From the command line, use standard installation commands to install the package.

A RIDE shortcut is added to the desktop.

## macOS

RIDE requires macOS High Sierra (10.13) or later.

RIDE is the default UI for Dyalog on macOS and is installed at the same time as Dyalog (see the [Dyalog for macOS Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20macOS%20Installation%20and%20Configuration%20Guide.pdf)); no further installation is required.

You can also install RIDE as a separate, stand-alone, product, for example to work exclusively with remote APL interpreters:

1. Download the **.pkg** file from the [RIDE releases page](https://github.com/Dyalog/ride/releases).
2. Double-click on RIDE's **.pkg** file.
3. Follow the instructions.

RIDE is added to the **Applications** directory (accessed by selecting **Applications** from the **Go** menu in the **Finder** menu bar, or by activating Spotlight with <kbd>⌘</kbd>+<kbd>Space</kbd> and typing RIDE).

Starting RIDE will add RIDE's icon to the temporary "Recently Used Apps" area to the right of the dock. To keep the RIDE icon in the dock permanently, right-click on the icon and select `Options > Keep in Dock` from the drop-down list that appears.

## Windows

RIDE requires Windows 10 or later.

1. Download the **.zip** file from the [RIDE releases page](https://github.com/Dyalog/ride/releases).
2. Unzip the downloaded **.zip** file, placing the `setup_ride.exe` and `setup_ride.msi` files in the same location as each other.
3. Double-click on the `setup_ride.exe` file.
4. Follow the instructions.

A RIDE shortcut is added to the desktop

## Configuration (.ini) File

A **.ini** configuration file can be used to define settings for the `RIDE_INIT` configuration parameter. By default, the interpreter will look for a **ride.ini** file in:

-  the directory in which the default session and log files are stored, for example, **C:\Users\JohnDoe\AppData\Local\Programs\Dyalog** (on Microsoft Windows)
- **$HOME/.dyalog** (on all other platforms)

This file is not automatically created by Dyalog but can be created manually. Examples of the fields that you might want to include within the **.ini** configuration file are included in the [sample configuration file](sample_configuration_file.md).

A different name and location for the .ini configuration file can be specified by including a second `mode`, `CONFIG`, in the [RIDE_INIT](ridespecific_language_features.md/#ride_init) parameter and setting it so that `CONFIG=<filename>`, where `<filename>` is the fully-qualified path to, and name of, a **.ini** configuration file containing name-value pairs related to mode, certificate details, and so on.

!!!note
    The **.ini** configuration file must be located on the machine on which the interpreter is running (this is not necessarily the same machine as the one on which RIDE is running).
