# Keyboard Shortcuts

The Dyalog keyboard shortcuts that are supported by the RIDE are listed below; those that can be configured in the [Shortcuts tab](shortcuts_tab.md) of the Preferences dialog box are indicated with a * character.

| Code | Command | Default Keystrokes | Description |
| --- | --- | --- | --- |
| ABT* | About Dyalog | Shift + F1 | Display the About Dyalog dialog box |
| AC* | Align comments |  | Edit : Align comments to current column |
| AO* | Comment out lines |  | Session/Edit : Add comment symbol at start of each tagged or current line |
| BH* | Run to exit (in tracer) |  | Trace : Continue execution from the current line to completion of the current function or operator. If successful, the selection advances to the next line of the calling function (if there is one). |
| BK* | Backward or Undo | Ctrl + Shift + Backspace | Session : Show previous line in input history Edit : Undo last change (where possible) Trace : Skip back one line |
| BP* | Toggle breakpoint |  | Edit / Trace : Toggle a breakpoint on the current line |
| BT* | Back Tab between windows | Ctrl + Shift + Tab | Move to previous window in loop |
| CAM* | Clear all trace/ stop/monitor |  | Remove any trace/stop/monitor flags (as set by `⎕TRACE` , `⎕STOP` and `⎕MONITOR` ) from all functions in the workspace |
| CAW* | Close all windows |  | Close all open Edit and Trace windows |
| CBP* | Clear stops for active object |  | Edit / Trace : Clear all breakpoints (resets `⎕STOP` ) on the function(s). |
| CNC* | Connect |  | Display the [RIDE-Dyalog Session dialog box](the_ridedyalog_session_dialog_box.md) |
| CP | Copy | Linux: <kbd>Ctrl</kbd> + <kbd>C</kbd> macOS: <kbd>⌘</kbd> + <kbd>C</kbd> Windows: <kbd>Ctrl</kbd> + <kbd>C</kbd> | Session / Edit : Copy highlighted block of text to the clipboard |
| CT | Cut | Linux: <kbd>Ctrl</kbd> + <kbd>X</kbd> macOS: <kbd>⌘</kbd> + <kbd>X</kbd> Windows: <kbd>Ctrl</kbd> + <kbd>X</kbd> | Session / Edit : Delete highlighted block of text and place it on the clipboard |
| DB | Backspace | Backspace | Delete character to left of cursor |
| DC | Down cursor | Down Arrow | Move cursor down one character |
| DI | Delete item | Linux: Delete macOS: <kbd>Fn</kbd> + <kbd>Backspace</kbd> Windows: <kbd>Delete</kbd> | Delete character to right of cursor |
| DK* | Delete lines | Delete | Session / Edit : Delete current line (or selected lines if selection exists) |
| DL | Down limit | Linux: <kbd>Ctrl</kbd> + <kbd>End</kbd> macOS: <kbd>⌘</kbd> + <kbd>Down Arrow</kbd> Windows: <kbd>Ctrl</kbd> + <kbd>End</kbd> | Session : Move cursor to bottom right corner of Session log Edit : Move cursor to bottom right corner of content |
| DMK* | Toggle key display mode |  | Functionality that could be useful when presenting demonstrations. Enables you to display your keystrokes and load/run a demo file. For more information on presenting demonstrations, enter `]Demo -?` in a Session. |
| DMN* | Next line in demo |  |
| DMP* | Previous line in demo |  |
| DMR* | Load demo file |  |
| DO* | Uncomment lines |  | Session / Edit : Remove comment symbol that is first non space character on each tagged or current line |
| DS | Down screen | Linux: Page Down macOS: Fn + Down Arrow Windows: Page Down | Move cursor down one screen |
| ED* | Edit | Shift + Enter | Session : Open an Edit window (if there is a suspended function on the stack, this opens an Edit window for that function – this is called Naked Edit ) Edit (a class or namespace): Move the cursor to the definition of the name under or immediately before/after the cursor (also see <JBK> ) Edit (not a class or namespace): Open a new Edit window for the name under or immediately before/after the cursor |
| EP* | Exit and save changes | Escape | Edit : Fix and Close Trace : Cut stack back to calling function; close all windows to match new stack status |
| ER* | Execute line | Enter | Session : Execute current line/all modified lines Edit : Insert new line Trace : Execute current line |
| EXP* | Expand Selection | Shift + Alt + Up Arrow | Successive presses of <EXP> expand the highlighted selection Session: select the: current line entire Session log Edit: select the: current token (number, name, string, and so on) current line entire contents of window |
| FD* | Forward or Redo | Ctrl + Shift + Enter | Session : Show next line in input history Edit : Reapply last change Trace : Skip current line |
| FX* | Fix the current function |  | Edit : Fixes the function without closing the Edit window |
| HLP* | Help | F1 | Display the documentation for the system command, system name, control structure keyword or primitive glyph immediately to the left of the cursor |
| HO | Home cursor | Linux: Ctrl + Home macOS: ⌘ + Up Arrow Windows: Ctrl + Home | Session : Move cursor to top left corner of Session log Edit : Move cursor to top left corner of content |
| JBK* | Jump back | Ctrl + Shift + J | Edit (a class or namespace): move the cursor back to where the last double-click or Edit command (`<ED>`) was issued in the current Edit window. Repeatable. |
| JSC* | Show JavaScript Console | F12 | Display the JavaScript console. Only necessary if requested by Dyalog Ltd. when reporting an issue. |
| LBR* | Toggle Language bar |  | Toggle display of the [Language bar](language_bar.md) at the top of the Session window |
| LC | Left cursor | Left Arrow | Move cursor left one character |
| LL | Left limit | Linux: Home macOS: Fn + Left Arrow Windows: Home | Move cursor to the first non-blank character on the current line. If already there, move cursor to start of line. |
| LN* | Toggle line numbers |  | Turn line numbers on/off in all windows of the same type as the active window |
| LOG* | Show RIDE protocol log | Ctrl + F12 | Display the RIDE protocol log. Only necessary if requested by Dyalog Ltd when reporting an issue. |
| MA* | Continue execution of all threads |  | Restart execution of any paused or suspended threads. For information on threads, see the Dyalog Programming Reference Guide . |
| NEW* | New Session | Ctrl + N | Starts a new Dyalog Session (a new instance of the interpreter) |
| NX* | Next match |  | Edit / Trace : When performing a Search/Replace, locate first match after current one |
| PF1* | Function Key 1 |  | <user-defined functionality> |
| PF2* - PF10* | Function Keys 2 ‑ 10 | F2 - F10 | <user-defined functionality> |
| PF11* - PF48* | Function Keys 11 ‑ 48 |  | <user-defined functionality> |
| PRF* | Show preferences |  | Display the [Preferences dialog box](preferences_dialog_box.md) ) |
| PT | Paste | Linux: Ctrl + V macOS: ⌘ + V Windows: Ctrl + V | Session / Edit : Paste the text contents of the clipboard at cursor |
| PV* | Previous match |  | Edit / Trace : When performing a Search/Replace, locate first match before current one |
| QCP | Quick Command Palette |  | Expose the underlying (Monaco) editor command palette |
| QIT* | Quit Session | Ctrl + Q | Terminate the Dyalog Session |
| QT* | Close window (and lose changes) | Shift + Escape | Session : Undo changes to a previously-entered expression that has not been re-executed and advance the cursor to the next line Edit : Close without saving changes |
| RC | Right cursor | Right Arrow | Move cursor right one character |
| RD* | Reformat |  | Edit : Formats function to have correct indentation and spacing between tokens |
| RL | Right limit | Linux: End macOS: Fn + Right Arrow Windows: End | Move cursor to the last non-blank character on the current line. If already there, move to end of line. |
| RP* | Replace string |  | Edit : Replace. To do this, enter `<RP>` and type the string to replace the  current search string with (see `<SC>`); enter `<ER>` to make the change. Enter `<EP>` to clear the field. |
| SA* | Select all | Linux: Ctrl + A macOS: ⌘ + A Windows: Ctrl + A | Select all text in the active window |
| SBR* | Toggle Status bar |  | Toggle display of the [Status bar](status_bar.md) at the bottom of the Session window and floating Edit / Trace windows. |
| SC* | Search | Ctrl + F | Edit / Trace : Search. To do this, enter `<SC>`, type the string to search for and then enter `<ER>` to find the first occurrence of the string. Enter `<EP>` to clear the field. Also see related `<NX>`, `<PV>` and `<RP>`. |
| SI* | Strong interrupt |  | Suspend code execution as soon as possible (generally after completing execution of the primitive currently being processed) |
| STL* | Skip to line |  | Trace : Move the current execution marker to the line on which the cursor is positioned |
| TB* | Tab between windows | Ctrl + Tab | Move to next window in loop |
| TC* | Trace line | Ctrl + Enter | Session : If entered directly after an expression, open a Trace window for that expression ( explicit trace ). If there is a suspended function on the execution stack, open a Trace window for that function ( naked trace ). |
| TGC* | Toggle comment |  | Session / Edit : Toggle a comment glyph at the start of the line in which the cursor is located |
| TIP* | Show value tips |  | For the name or glyph under or immediately before the cursor, highlight that name/glyph and display: for a name: its referent (for example, the value of a variable or the code of a function) for a glyph: the name of the glyph, the keyboard shortcut to enter it, its name and examples of its syntax, arguments and result |
| TL* | Toggle localisation | Ctrl + Up Arrow | Edit : For tradfns, the name under the cursor is added to or removed from the list of localised names on the function's header line |
| TO* | Toggle fold |  | Edit : Open/Close outlined blocks (by default, outlines are shown) |
| TVB* | Toggle view steps |  | Edit / Trace : Toggle display of an additional column at the left-hand side of the window in which break-points can be set/unset. Hiding this column does not remove any previously-set break points. |
| TVO* | Toggle view outline |  | Edit : Toggle code folding/outlining for control structures (including `:Section` structures) and functions. When toggled, existing code in an open Edit window is automatically updated to reflect the new rules. |
| TFR* | Refresh threads |  | [Debug information window](debug_information_window.md): Forces a refresh of the Threads area |
| UC | Up cursor | Up Arrow | Move cursor up one character |
| UL | Up limit | Linux: Ctrl + Home macOS: ⌘ + Up Arrow Windows: Ctrl + Home | Session : Move cursor to top left corner of Session log Edit : Move cursor to top left corner of content |
| US | Up screen | Linux: Page Up macOS: Fn + Up Arrow Windows: Page Up | Move cursor up one screen |
| VAL* | Evaluate selection or name |  | Edit : Evaluate the selected expression or name and display the result in the Session window. |
| WI* | Weak interrupt | Ctrl + PauseBreak | Suspend code execution at the start of the next line (generally after completing execution of the statement currently being processed) |
| WSE* | Toggle Workspace Explorer |  | Toggle display of the [workspace explorer](workspace_explorer.md) to the left of the Session window |
| ZM* | Toggle maximise Edit window |  | Toggle active Edit window between current size and full Session size |
| ZMI* | Increase font size | Ctrl + = or Ctrl + Shift + = | Increase the size of the font in all the windows |
| ZMO* | Decrease font size | Ctrl + - | Decrease the size of the font in all the windows |
| ZMR* | Reset font size | Ctrl + 0 | Reset the size of the font in all the windows to its default value |


