



## Edit Window

This section applies to the RIDE's built-in editor. A different editor can be specified by setting the RIDE_EDITOR configuration parameter to the fully-qualified path of the desired editor's executable file.

The Edit window is used to define new objects as well as view/amend existing objects.


An Edit window can be opened from the Session window in any of the following ways:

- Enter `)ED <object name>`
- Enter `⎕ED '<object name>'`
- Enter `<object name>` <ED>(for an explanation of the <ED> syntax, see [Section ](keyboard_shortcuts_and_command_codes.md#))
- Double-click on/after `<object name>`

If the object name does not already exist, then it is assumed to of function/operator type. Different types can be explicitly specified using the `)ED` or `⎕ED` options – see `)ED` or `⎕ED` in the Dyalog APL Language Reference Guide.


An Edit window can be opened from the Trace window by entering the Edit command (<ED>), double‑clicking the cursor or clicking the  button in the toolbar (see [Section ](toolbar_tracewindow.md#)). The position of the cursor when this is done determines the name of the object that the Edit window is for:

- If the cursor is on or immediately after `<object name>`, then the Edit window opens on that name.
- If the cursor is anywhere else, then the Edit window opens for the most recently-referenced function on the stack. This is a naked edit.

An Edit window can be opened from another Edit window in any of the following ways:

- Move the cursor over/after `<object name>` and enter the Edit command (<ED>)
- Double-click on/after `<object name>`

By default, the Edit window is docked to the right of the Session Window.


