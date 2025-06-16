# Edit and Trace Windows

## Edit

An **Edit** window can be opened in any of the following ways:

- Enter `)ED <item name>` in the interactive session
- Enter `⎕ED '<item name>'` in the interactive session
- Press <kbd>Shift</kbd>+<kbd>Enter</kbd> (can be configured via `Edit > Preferences> Shortcuts > ED`) while the text cursor is on or adjacent to any item name
- Double-click on or adjacent to an item name (can be toggled via `Edit > Preferences > Trace/Edit > Double click to edit`)

If the object name does not already exist, then it becomes a function or operator. Different types can be explicitly specified using the [)ED]({{ config.extra.dyalog_docs_host }}/language-reference-guide/system-commands/ed/) or [⎕ED]({{ config.extra.dyalog_docs_host }}/language-reference-guide/system-functions/ed/) options.

A **Trace** window can be temporarily changed into an **Edit** window by pressing <kbd>Shift</kbd>+<kbd>Enter</kbd> or clicking <img src="../img/screenshots/i_intext_editname.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> while the text cursor is not on or adjacent to any name.

To save your changes and exit the **Edit** window, press <kbd>Esc</kbd> (can be configured via `Edit > Preferences> Shortcuts > EP`) or click <img src="../img/screenshots/i_intext_quit.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 14px;" />.

To exit the **Edit** window without saving, press <kbd>Shift</kbd>+<kbd>Esc</kbd> (can be configured via `Edit > Preferences> Shortcuts > QT`).

## Trace

The **Trace** window aids debugging by enabling you to step through your code line by line, display variables in **Edit** windows and watch them change as the execution progresses.

A **Trace** window can be opened from the **Session** window by pressing <kbd>Ctrl</kbd>+<kbd>Enter</kbd> (can be configured via `Edit > Preferences > Shortcuts > TC`) after typing an expression.

!!!note
    By default, Dyalog is also configured to initiate an automatic trace whenever an error occurs, that is, the **Trace** window opens and becomes the active window and the line that caused the execution to suspend is selected. This is controlled by the interpreter configuration parameter `TRACE_ON_ERROR`. For information on configuration parameters, see the Dyalog Installation and Configuration Guide for your operating system:

    - [macOS Installation and Configuration Guide]({{ config.extra.dyalog_docs_host }}/Dyalog_for_macOS_Installation_and_Configuration_Guide.pdf)
    - [Microsoft Windows Installation and Configuration Guide]({{ config.extra.dyalog_docs_host }}/Dyalog_for_Microsoft_Windows_Installation_and_Configuration_Guide.pdf)
    - [UNIX Installation and Configuration Guide]({{ config.extra.dyalog_docs_host }}/Dyalog_for_UNIX_Installation_and_Configuration_Guide.pdf)

To resume execution, press the |> button (can be given a keyboard shortcut via `Edit > Preferences> Shortcuts > RM`).

To resume execution until the current function returns, press the |¯\\. button (can be given a keyboard shortcut via `Edit > Preferences> Shortcuts > BH`).

To cut back the stack one level, press <kbd>Esc</kbd> (can be configured via Edit > Preferences> Shortcuts > `EP`) or click <img src="../img/screenshots/i_intext_quit.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 14px;" />.

## Inline Trace

**Inline Tracing** allows you to step through the elements of an expression right to left. An **Inline Trace** window can be opened from the **Session** by pressing <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Enter</kbd> (can be configured via `Edit > Preferences > Shortcuts > IT`) after typing an expression. Step through the expression using the same key combination.

If you're already in the **Trace** window, you can still step through expressions inline with <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Enter</kbd>.

## Navigating the Windows

New Edit and Trace windows can be floating rather than docked by selecting the **Floating windows** checkbox in the [Trace/Edit](customising_your_session.md/#windows-tab) of the **Preferences** dialog box.

Docked or not, the **Session**, **Edit** and **Trace** windows form a closed loop for the purpose of navigation:
- to make the next window in this loop the active window, press <kbd>Tab</kbd> (can be configured via `Edit > Preferences> Shortcuts > TB`)
- to make the previous window in this loop the active window, press <kbd>Shift</kbd>+<kbd>Tab</kbd> (can be configured via `Edit > Preferences > Shortcuts > BT`)

You can close all **Trace/Edit** windows without clearing the stack by selecting the `Window > Close All Windows` menu option or using [2023⌶]({{ config.extra.dyalog_docs_host }}/language-reference-guide/the-i-beam-operator/close-all-windows/).
