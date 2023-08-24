# Working in a Dyalog Session

The main purpose of a development environment is to enable a user to enter and execute expressions; this chapter describes how this can be achieved when running a Dyalog Session through the RIDE and explains the functionality that is provided to simplify the process. 

## Keyboard Shortcuts and Command Codes

Keyboard shortcuts are keystrokes that execute an action rather than produce a symbol. The RIDE supports numerous keyboard shortcuts, each of which is identified by a command code and mapped to a keystroke combination; for example, the action to open the **Trace** window  is identified by the code **TC** (described in the documentation as `<TC>`). For a complete list of the command codes that can be used in a Dyalog Session running through the RIDE and the keyboard shortcuts for those command codes, see [Keyboard Shortcuts](keyboard_shortcuts.md).

Positioning the cursor over the <img src="../img/screenshots/b_shortcuts.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> button on the right hand side of the Language bar displays a dynamic tooltip showing all configured keyboard shortcuts for command codes. Clicking on the <img src="../img/screenshots/b_shortcuts.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> button displays the **Preferences** dialog box (the same as selecting the `Edit > Preferences` menu option), through which keyboard shortcuts can be customised (see [Shortcuts Tab](shortcuts_tab.md)).

## Navigating the Windows

When multiple windows are open, the window that has the focus is referred to as the active window. A window can be made the active window by clicking within it.

The **Session**, **Edit** and **Trace** windows form a closed loop for the purpose of navigation:

- to make the next window in this loop the active window, enter the Tab Window command (`<TB>`)
- to make the previous window in this loop the active window, enter the Back Tab Window command (`<BT>`)

An active **Edit/Trace** window can be closed after changes have been made to its content:

- to save any changes in the content of the active window before closing it, enter the Escape command (`<EP>`), press the  button in its menu bar or, if the window is docked, press  in the window's tab.
- to discard any changes in the content of the active window before closing it, enter the Quit command (`<QT>`)

## Display of Windows

By default, the Trace window and Edit windows are docked beneath and to the right of the Session window respectively. If the menu option View > Show Workspace Explorer is checked, then the workspace explorer is docked to the far left of any open windows; if the menu option `View > Show Debug` is checked, then the debug information window is docked to the far right of any open windows (see [Session User Interface](session_user_interface.md).

Docked windows can be selected (by clicking within them), resized (by moving the splitter bar) and maximised/minimised (by toggling the icon at the top right of each window).

New Edit and Trace windows can be floating rather than docked by selecting the Floating windows checkbox in the [Windows tab](windows_tab.md) of the Preferences dialog box.

Clicking in the tab of any window enables that window to be dragged to a different location.

## Entering APL Characters

APL glyphs can be entered in a Dyalog Session running through the RIDE by:

- typing the glyph in the Session window or Edit window using the appropriate [key combination](keyboard_key_mappings_for_apl_glyphs.md).
- clicking the appropriate glyph on the [Language bar](language_bar.md) – this inserts that glyph into the active Session/Edit window at the position of the cursor.

When typing a glyph directly rather than using the Language bar, if you pause after entering the prefix key then the [autocomplete functionality](autocomplete.md) displays a list of all the glyphs that can be produced. If you enter the prefix key a second time then a list of all the glyphs that can be produced is again displayed but this time with the names (formal and informal) that are used for each glyph.

For example:

- `` ` ``      ⍝ default prefix key

The autocomplete functionality list includes the following for the `⍟` glyph:

- ⍟ `* ``logarithm 
- ⍟ `* ``naturallogarithm
- ⍟ `* ``circlestar
- ⍟ `* ``starcircle
- ⍟ `* ``splat

This means that you can enter the `⍟` glyph by selecting (or directly typing) any of the following:

- `` ` ``*      
- ``logarithm      
- ``naturallogarithm
- ``circlestar      
- ``starcircle
- ``splat

As you enter a name, the autocomplete functionality restricts the list of options to those that match the entered name. For example, entering:

- ``ci

restricts the list to:

- ⍟ `` ` ``* ``circlestar
- ○ `○ ``circular
- ⌽ `% ``circlestile
- ⊖ `& ``circlebar
- ⍉ `^ ``circlebackslash
- ⍥ `O ``circlediaeresis

## Entering Expressions

The RIDE provides several mechanisms that assist with accuracy and provide clarity when entering expressions in a Dyalog Session, including, *paired enclosures*, *autocomplete*, *context-sensitive help* and *syntax clouring*. These are explained below.

### Paired Enclosures

Applicable in the **Session** window and the **Edit** window

Enclosures in the RIDE include:

- parentheses `( )`
- braces `{ }`
- brackets `[ ]`

Angle brackets `< >` are *not* enclosures.

When an opening enclosure character is entered, the RIDE automatically includes its closing pair. This reduces the risk of an invalid expression being entered due to unbalanced enclosures. This feature can be disabled in the General tab of the Preferences dialog box.

### Autocomplete

Applicable in the *Session* window and the I window

The RIDE includes autocomplete functionality for names to reduce the likelihood of errors when including them in an expression (and to save the user having to enter complete names or remember cases for case-sensitive  names).

As a name is entered, the RIDE displays a pop-up window of suggestions based on the characters already entered and the context in which the name is being used.

For example, if you enter a `⎕` character, the pop-up list of suggestions includes all the system names (for example, system functions and system variables). Entering further characters filters the list so that only those system functions and variables that start with the exact string entered are included.

When you start to enter a name in the *Session* window, the pop-up list of suggestions includes all the namespaces, variables, functions and operators that are defined in the current namespace. When you start to enter a name in the *Edit* window, the pop-up list of suggestions also includes all names that are localised in the function header.

To select a name from the pop-up list of suggestions, do one of the following:

- click the mouse on the name in the pop-up list
- use the right arrow key to select the top name in the pop-up list
- use the up and down arrow keys to navigate through the suggestions and the right arrow key or the <kbd>tab</kbd> key to enter the currently-highlighted name

The selected name is then completed in the appropriate window.

This feature can be disabled or customised in the General tab of the Preferences dialog box.

### Context-Sensitive Help

Applicable in the **Session** window, **Edit** window and **Trace** window

With the cursor on or immediately after any system command, system name, control structure keyword or primitive glyph, enter the *Help* command (`<HLP>`). The documentation for that system command, system name, control structure keyword or primitive glyph will be displayed.

### Syntax Colouring

Applicable in the **Edit** window and **Trace** window

Syntax colouring assigns different colours to various components, making them easily identifiable. The default syntax colouring convention used is detailed below.

<table style="border-collapse: collapse;margin-left: 0;margin-right: auto;mc-caption-repeat: true;width: auto;">
    <col />
    <col />
    <thead>
        <tr>
            <th colspan="2">Colour</th>
            <th>Syntax</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="background-color:black" width="30">
            </td>
            <td>black</td>
            <td>
                <p>global names</p>
                <p>session input/output (unless specified elsewhere)</p>
            </td>
        </tr>
        <tr>
            <td style="background-color:gray">
            </td>
            <td>grey</td>
            <td>names<br />namespaces<br />numbers<br />tradfn syntax (header line and final <code>∇</code> in scripted syntax)
            </td>
        </tr>
        <tr>
            <td style="background-color:maroon">
            </td>
            <td>maroon</td>
            <td>control structure keywords</td>
        </tr>
        <tr>
            <td style="background-color:red">
            </td>
            <td>red</td>
            <td>errors (including unmatched parentheses, quotes and braces)</td>
        </tr>
        <tr>
            <td style="background-color:teal">
            </td>
            <td>teal</td>
            <td>strings<br />comments
            </td>
        </tr>
        <tr>
            <td style="background-color:navy">
            </td>
            <td>navy</td>
            <td>primitive functions<br />zilde
            </td>
        </tr>
        <tr>
            <td style="background-color:blue">
            </td>
            <td>blue</td>
            <td>idioms (this takes priority over any other syntax colouring)<br />operators<br />parentheses/braces/brackets<br />dfn syntax (specifically, <code>{ } ⍺ ⍵ ∇</code> and <code>:</code>)<br />assignment (<code>←</code>), diamond (<code>⋄</code>) and semi-colon (<code>;</code>)
            </td>
        </tr>
        <tr>
            <td style="background-color:purple">
            </td>
            <td>purple</td>
            <td>system names</td>
        </tr>
    </tbody>
</table>

The foreground colour and/or the background colour (highlighting) can be customised by syntax type.

## Executing Expressions

### Executing a New Expression

*Applicable in the **Session** window*

After entering a new expression in the input line, that expression is executed by pressing the <kbd>Enter</kbd> key or with the Enter command (`<ER>`). Following execution, the expression (and any displayed results) become part of the Session log.

### Re-executing a Previous Expression

*Applicable in the **Session** window*

Instead of entering a new expression in the input line, you can move back through the Session log and re-execute a previously-entered expression.

---
**To re-execute a previously-entered expression**

1. Locate the expression to re-execute in one of the following ways:
    - Scroll back through the Session log.
    - Use the Backward command (`<BK>`) and the Forward command (`<FD>`) to cycle backwards and forwards through the input history, successively copying previously-entered expressions into the input line.
2. Position the cursor anywhere within the expression that you want to re execute and press the <kbd>Enter</kbd> key or use the *Enter* command (`<ER>`).

---

If required, a previously-entered expression can be amended prior to execution. In this situation, when the amended expression is executed it is copied to the input line; the original expression in the Session log is not changed. If you start to edit a previous expression and then decide not to, use the *Quit* command (`<QT>`) to return the previous expression to its unaltered state.

### Re-executing Multiple Previous Expressions

*Applicable in the **Session** window*

Multiple expressions can be re-executed together irrespective of whether they were originally executed sequentially (certain system commands cause re‑execution to stop once they have been completed, for example, `)LOAD` and `)CLEAR`).

---
To re-execute multiple previously-entered expressions

1. Locate the first expression to re-execute in one of the following ways:
    - Scroll back through the Session log.
    - Use the Backward command (`<BK>`) and the Forward command (`<FD>`) to cycle backwards and forwards through the input history, successively copying previously-entered expressions into the input line.
2. Change the expression in some way. The change does not have to impact the purpose of the expression; it could be an additional space character.
3. Scroll through the Session log to locate the next expression to re-execute and change it in some way. Repeat until all the required expressions have been changed.
4. Press the Enter key or enter the Enter command (`<ER>`).

---

The amended expressions are copied to the input line and executed in the order in which they appear in the Session log; the modified expressions in the Session log are restored to their original content.

To re-execute contiguous previously-entered expressions

1. Position the cursor at the start of the first expression to re-execute.
2. Press and hold the mouse button (left-click) while moving the cursor to the end of the last expression to re-execute.
3. Copy the selected lines to the clipboard using the Copy command (`<CP>`) or the Cut command (`<CT>`) or the Copy/Cut options in the Edit menu.
4. Position the cursor in the input line and paste the content of the clipboard back into the Session using the Paste command (`<PT>`), the Paste option in the Edit menu or the Paste option in the context menu.
5. Press the Enter key or enter the Enter command (`<ER>`).

This technique can also be used to move lines from the Edit window into the Session window and execute them.

## Threads

The RIDE supports multithreading. For information on threads, see the Dyalog Programming Reference Guide.

The number of threads currently in use is displayed in the Status bar.

## Suspending Execution

To assist with investigations into the behaviour of a set of statements (debugging), the system can be instructed to suspend execution just before a particular statement. This is done by setting a *breakpoint*.

It is sometimes necessary to suspend the execution of a function, for example, if an  endless loop has been inadvertently created or a response is taking an unacceptably long time. This is done using an *interrupt*.

Suspended functions can be viewed through the stack; the most recently-referenced function is at the top of the stack. The content of the stack can be queried with the `)SI` system command; this generates a list of all suspended and pendent (that is, awaiting the return of a called function) functions, where suspended functions are indicated by a `*`. For more information on the stack and the state indicator, see the Dyalog Programming Reference Guide.

### Breakpoints

*Applicable in the **Edit** window and the **Trace** window*

When a function that includes a breakpoint is run, its execution is suspended immediately before executing the line on which the breakpoint is set and the **Trace** window is automatically opened (assuming that automatic [trace](trace_window.md) is enabled.

Breakpoints are defined by dyadic `⎕STOP` and can be toggled on and off in an **Edit** or **Trace** window by left-clicking on the far left of the line before which the breakpoint is to be applied or by placing the cursor anywhere in the line before which the breakpoint is to be applied and entering the *Toggle Breakpoint* command (`<BP>`). Note that:

- Breakpoints set or cleared in an **Edit** window are not established until the function is fixed.
- Breakpoints set or cleared in a **Trace** window are established immediately.

When a breakpoint is reached during code execution, event 1001 is generated; this can be trapped. For more information, see  `⎕TRAP` in the [Dyalog APL Language Reference Guide](https://docs.dyalog.com/latest/Dyalog%20APL%20Language%20Reference%20Guide.pdf).

### Interrupts

A Dyalog Session running through the RIDE responds to both strong and weak interrupts.

Entering a strong interrupt suspends execution as soon as possible (generally after completing execution of the primitive currently being processed). A strong interrupt is issued by selecting `Actions > Strong Interrupt` in the menu options or by entering the Strong Interrupt command (`<SI>`).

Entering a weak interrupt suspends execution at the start of the next line (generally after completing execution of the statement currently being processed). A weak interrupt is issued by selecting `Actions > Weak Interrupt` in the menu options or by entering the Weak Interrupt command (`<WI>`).

!!!note
    When a strong or weak interrupt is issued during code execution, event 1003 or 1002 (respectively) is generated; these can be trapped. For more information, see  `⎕TRAP` in the [Dyalog APL Language Reference Guide](https://docs.dyalog.com/latest/Dyalog%20APL%20Language%20Reference%20Guide.pdf).

## Terminating a Dyalog Session Running Through the RIDE

The Dyalog Session can be terminated (without having to close any open windows first) in any of the following ways:

- From the menu options: 
    - Linux: Select `File > Quit`
    - macOS: Select `Dyalog > Quit Dyalog`
    - Microsoft Windows: Select `File > Quit`

- Enter:
    - Linux: <kbd>Ctrl</kbd> + <kbd>Q</kbd>
    - macOS : <kbd>⌘</kbd> + <kbd>Q</kbd>
    - Microsoft Windows: <kbd>Ctrl</kbd> + <kbd>Q</kbd> (only if the Dyalog Unicode IME is not enabled).

In addition, when the **Session** window is the active window, the Dyalog Session can be terminated cleanly in any of the following ways:

- Enter `)OFF`
- Enter `⎕OFF`
- Enter `<QIT>`
- macOS: <kbd>⌘</kbd> + <kbd>W</kbd>



