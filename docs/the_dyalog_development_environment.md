# The Dyalog Development Environment

## Interactive Session Window

Ride's main interface is an interactive session, where you enter expressions and the interpreter prints results.

Along the left edge of the interactive session is a narrow area that shows input/output information. It indicates modified lines and code blocks (which will be executed next time you press <kbd>Enter</kbd>) and indicates which output lines belong together.

Display of the session indicator margin can be toggled via `Edit > Preferences > General > Session > Show session margin`.

### Multi-line Session Input

Sessions allow multi-line input.

!!!note
    This optional feature is on by default. To disable it, set the DYALOG_LINEEDITOR_MODE configuration parameter to 0 (for more information, see the [Dyalog for macOS Installation and Configuration Guide]({{ config.extra.dyalog_docs_host }}/Dyalog_for_macOS_Installation_and_Configuration_Guide.pdf)).

With multi-line input enabled:
* grouped lines are syntax coloured in their entirety.
* if a change is made to one or more lines in a group, then the whole group is marked to be re-executed when ER is pressed.
* lines can be inserted into a group with the IL keystroke.
* the current line can be cleared with the EL keystroke. (It is not possible to UNDO a delete line in the session).
* if the interpreter detects an un-terminated control structure or dfn on a single line of input it:
  * enters a new multi-line mode which accumulates lines until the control structure or dfn is terminated.
  * executes a completed block of lines as if it were within a niladic defined function.

Multi-line input can be terminated by correctly terminating the input. For example, if you started a block of multi-line input with a `{` character, then a matching and similarly nested `}` character terminates it. Similarly, if you started a block of multi-line input with `:If` then a matching and similarly nested `:EndIf` terminates it. Issuing a weak interrupt aborts the multi-line input and all changes are lost.

## Status Bar

Below it, you will find the status bar which provides situational awareness. Items turn blue if non-default:

| Item | Description |
| --- | --- |
| `&: <number>` | Number of threads currently running (minimum value is 1).|
| `⎕DQ: <number>` | Number of events in the APL event queue. |
| `⎕TRAP` | Error trap in effect. |
| `⎕SI: <number>` | Number of stack frames in the current thread.|
| `⎕IO: <number>` | Current index origin. |
| `⎕ML: <number>` | Current migration level.  |
| `Pos <n>/<n>, <n>` | Cursor position in active window (line number/total lines, column number). |

## Workspace Explorer

The workspace explorer provides a tree view of the current workspace (`#`) and session namespace (`⎕SE`). It can also be used to edit or view any item by double-clicking on the item.

Display of the workspace explorer can be toggled with the `View > Show Workspace Explorer` menu option.

## Debug Information Window

The debug window provides information about currently running threads and the current stack.

The **Threads** area shows each thread's number (`⎕TID`) and name (`⎕TNAME`), its state (for example, `Session`, `Pending`, `:Hold`, `⎕NA`), and which tokens it awaits (`⎕TREQ`). For information on how to use threads, see the [Dyalog Programming Reference Guide]({{ config.extra.dyalog_docs_host }}/Dyalog_Programming_Reference_Guide.pdf).

The **SI Stack** area lists the functions in the execution stack, similar to the display of `)SI`.

Display of the debug information window can be toggled with the `View > Show Debug` menu option.

## Language Bar

At the top of the interactive session, you can find the language bar. Click on an APL glyph to type it. You can also hover your mouse over a glyph for a brief description and information about how to type it without using the language bar.

Display of the language bar can be toggled with the `View > Show Language Bar` menu option.

## Keyboard Mappings for APL Glyphs

A set of keyboard key mappings for APL glyphs is installed with Ride. When Ride is the active application, these key mappings are automatically enabled. Ride attempts to identify a user's locale and use the appropriate key mappings; if the locale cannot be identified or the locale-specific key mappings have not been configured, then the default configuration is used (key mappings for a US keyboard).

Using this set of key mappings, APL glyphs are entered by pressing the prefix key followed by either the appropriate key or the SHIFT key with the appropriate key. The prefix key and key mappings can be [customised](customising_your_session.md/#keyboard-tab).

### Other Keyboard Options

Installing and enabling a set of key mappings allows Dyalog glyphs to be entered in other applications (for example, email). An alternative set of key mappings can also be used to replace the default key mappings for Ride.

Information and the requisite downloadable files are available from Dyalog's [APL Fonts and Keyboards](https://www.dyalog.com/apl-font-keyboard.htm) page.

!!!note "Microsoft Windows"
    If you have the Dyalog Unicode IME installed, then Ride activates it by default. It can be disabled by unchecking the Also enable Dyalog IME checkbox in the [Keyboard tab](customising_your_session.md/#keyboard-tab) of the Preferences dialog box.

    If Dyalog is not installed on the machine that Ride is running on, then the Dyalog Unicode IME can be downloaded and installed from Dyalog's [APL Fonts and Keyboards](https://www.dyalog.com/apl-font-keyboard.htm) page.

