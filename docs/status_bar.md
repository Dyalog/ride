



### Status Bar


The Status bar is located at the bottom of the Session window. It contains a button and seven Session status fields, detailed below, as shown in [](#status bar); the items in the Status bar are detailed in [](#statusbar_items).




The Status bar





| Item | Description |
| --- | --- |
|  | Opens the Preferences dialog box (see [Section ](preferences_dialog_box.md#) ). |
| `&: <number>` | Displays the number of threads currently running (minimum value is 1). Turns blue if greater than 1. |
| `⎕DQ: <number>` | Displays the number of events in the APL event queue. Turns blue if non‑zero. |
| `⎕TRAP` | Turns blue if `⎕TRAPSI` is set. |
| `⎕SI: <number>` | Displays the length of `⎕SI` . Turns blue if non‑zero. |
| `⎕IO: <number>` | Displays the value of `⎕IO` . Turns blue if not equal to the value defined by the Default_IO configuration parameter (default = 1). |
| `⎕ML: <number>` | Displays the value of `⎕ML` . Turns blue if not equal to the value defined by the Default_ML configuration parameter (default = 1). |
| `Pos <n>/<n>, <n>` | Displays the location of the cursor in the active window (line number/total lines, column number). |


