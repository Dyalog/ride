# Working in a Dyalog Session

The main purpose of a development environment is to enable a user to enter and execute expressions; this chapter describes how this can be achieved when running a Dyalog Session through Ride and explains the functionality that is provided to simplify the process. 

## Keyboard Shortcuts and Command Codes

Keyboard shortcuts are keystrokes that execute an action rather than produce a symbol. Ride supports numerous keyboard shortcuts, each of which is identified by a command code and mapped to a keystroke combination; for example, the action to open the **Trace** window  is identified by the code **TC** (described in the documentation as `<TC>`). For a complete list of the command codes that can be used in a Dyalog Session running through Ride and the keyboard shortcuts for those command codes, see [Keyboard Shortcuts](keyboard_shortcuts.md).

Positioning the cursor over the <img src="../img/screenshots/b_shortcuts.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> button on the right hand side of the Language bar displays a dynamic tooltip showing all configured keyboard shortcuts for command codes. Clicking on the <img src="../img/screenshots/b_shortcuts.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> button displays the **Preferences** dialog box (the same as selecting the `Edit > Preferences` menu option), through which keyboard shortcuts can be customised (see [Shortcuts Tab](customising_your_session.md/#shortcuts-tab)).

## Entering APL Glyphs

APL glyphs can be typed by:

- typing the glyph in the **Session** window or **Edit** window using the appropriate [key combination](the_dyalog_development_environment.md/#keyboard-mappings-for-apl-glyphs) which is introduced using a prefix key.
- clicking the appropriate glyph on the [Language bar](the_dyalog_development_environment.md/#language-bar) – this inserts that glyph into the active **Session/Edit** window at the position of the cursor.

If you pause after pressing the prefix key then the autocomplete functionality displays a list of all the glyphs that can be produce together with their full key combinations and their name. If you enter the prefix key a second time then a list of all the glyphs and their full keyboard combinations is again displayed but this time with all the names (formal and informal) that are used for each glyph.

You can select an entry from the list using mouse or keyboard, or keep typing until your desired choice is active, then press <kbd>Tab</kbd> or <kbd>Right Arrow</kbd> to insert it.

## Executing Expressions

Ride provides several mechanisms that assist with accuracy when entering expressions in a Dyalog Session, including, auto-closing brackets, autocompleting control structures, and highlighting of matching words and brackets. These can be toggled via `Edit > Preferences > Contextual` help.

In the interactive session, you can use the cursor keys to navigate the log. Pressing <kbd>Enter</kbd> re-executes the current line, or all modified lines, if any. Modified lines are restored to their previous state, while their altered versions are copied to the bottom of the session log.

Alternatively, you can recall previously entered expressions using <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Backspace</kbd> for going back in time and <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> for going forwards in time (configurable via `Edit > Preferences > Shortcuts > BK` and `FD`).

If you set a keyboard shortcut (configurable via `Edit > Preferences > Shortcuts > VAL`) for the "Evaluate selection or name under cursor" action, then you can press your assigned shortcut to do exactly that.

## Threads

Ride supports multithreading. For information on threads, see the [Dyalog Programming Reference Guide](https://docs.dyalog.com/latest/Dyalog%20Programming%20Reference%20Guide.pdf).

## Setting Stop, Trace, and Monitor points

For information about stop (breakpoint), trace, and monitor points, see [Stop Controls](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/stop.htm), [Trace Controls](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/trace.htm), and [Monitor Controls](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/monitor.htm).

To toggle a Stop point, click in the far left margin of a **Trace** or **Edit** window.

To toggle a Trace or Monitor point, right-click in that margin and select from the context menu.

Stop, Trace and Monitor points are indicated in the margin with a red circle, a yellow circle, and a clockface, respectively. If more than one type of point has been set on a single code line, a plus icon will be shown instead. 

### Interrupts

A Dyalog Session running through Ride responds to both strong and weak interrupts.

A strong interrupt suspends execution as soon as possible (generally after completing execution of the primitive currently being processed). A strong interrupt is issued by selecting `Actions > Strong Interrupt`. You can assign a keyboard shortcut for this via `Edit > Preferences > Shortcuts > SI`.

A weak interrupt suspends execution at the start of the next line (generally after completing execution of the statement currently being processed). A weak interrupt is issued by selecting `Actions > Weak Interrupt` in the menu options or by pressing <kbd>Break</kbd> (usually <kbd>Ctrl</kbd>+<kbd>Pause</kbd>, but configurable via `Edit > Preferences > Shortcuts > WI`).

## Terminating a Dyalog Session Running Through Ride

Ride will close when the interpreter terminates, including through entering `)OFF` or `⎕OFF` in the interactive session.
