# Input Windows

Instead of just a single **Session** window, the Dyalog Development Environment can comprise multiple windows:

- **Session** window – created when a Dyalog Session is started through the RIDE and always present while the Session is live. There is only one [Session window](session_window_input.md).
- **Edit** windows – created and destroyed dynamically as required. There can be multiple [Edit windows](edit_window.md) (one for each APL object).
- **Trace** window – created and destroyed dynamically as required. There is only one [Trace window](trace_window.md).

When multiple windows are open, the window that has the focus is referred to as the *active window*.

## Session Window

The **Session** window contains:

- the *input line* – the last line entered in the **Session** window; this is (usually) the line into which you type an expression to be evaluated.
- a *gutter* – the left-hand side of the window is a gutter that can include input/output information. Specifically: a small red circle in the gutter is present on every line that has been modified since last pressing Enter. This includes old lines that have been modified as well as new lines. These indicators show which lines will be executed when you subsequently hit Enter, at which point the indicator is removed.a left bracket indicates "groups" of default output (to distinguish it from `⎕` or `⍞` output).
- a small *red circle* in the gutter is present on every line that has been modified since last pressing <kbd>Enter</kbd>. This includes old lines that have been modified as well as new lines. These indicators show which lines will be executed when you subsequently hit <kbd>Enter</kbd>, at which point the indicator is removed.
- a *left bracket* indicates "groups" of default output (to distinguish it from `⎕` or `⍞` output).
- the *Session log* – a history of previously-entered expressions and the results they produced.

If a log file is being used, then the Session log is loaded into memory when a Dyalog Session is started. When the Dyalog Session is closed, the Session log is written to the log file, replacing its previous contents.

## Edit Window

!!!note
    This section applies to the RIDE's built-in editor. A different editor can be specified by setting the `RIDE_EDITOR` configuration parameter to the fully-qualified path of the desired editor's executable file.

The **Edit** window is used to define new objects as well as view/amend existing objects.

An **Edit** window can be opened from the Session window in any of the following ways:

- Enter `)ED <object name>`
- Enter `⎕ED '<object name>'`
- Enter `<object name>` [<ED>](keyboard_shortcuts_and_command_codes.md)
- Double-click on/after `<object name>`

If the object name does not already exist, then it is assumed to of function/operator type. Different types can be explicitly specified using the `)ED` or `⎕ED` options – see `)ED` or `⎕ED` in the [Dyalog APL Language Reference Guide](https://docs.dyalog.com/latest/Dyalog%20APL%20Language%20Reference%20Guide.pdf).

An Edit window can be opened from the Trace window by entering the Edit command (`<ED>`), double‑clicking the cursor or clicking the <img src="../img/screenshots/i_intext_editname.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> button in the [toolbar](toolbar_tracewindow.md). The position of the cursor when this is done determines the name of the object that the Edit window is for:

- If the cursor is on or immediately after `<object name>`, then the Edit window opens on that name.
- If the cursor is anywhere else, then the **Edit** window opens for the most recently-referenced function on the stack. This is a naked edit.

An Edit window can be opened from another Edit window in any of the following ways:

- Move the cursor over/after `<object name>` and enter the Edit command (`<ED>`)
- Double-click on/after `<object name>`

By default, the **Edit** window is docked to the right of the **Session Window**.

### Toolbar (Edit Window)

The Edit Window's toolbar exposes the following actions:

| Icon | Action | Description |
| --- | --- | --- |
| ![Save and close](img/screenshots/s_Tracewin_quitfunction.png) | Save changes and return | Saves changes and closes the Edit Window. |
| ![Toggle line numbers](img/screenshots/i_Editwin_togglelinenumbers.png)| Toggle line numbers | Turns the display of line numbers on/off. |
| ![Comment selected](img/screenshots/i_Editwin_commenttext.png) | Comment selected text | Add a comment symbol (`⍝`) to the beginning of the line in which the cursor is positioned. If text has been selected, then a comment symbol is added at the start of the line on which the selection starts and at the start of each subsequent line of text within the selection. Same as the Comment Out command (`<AO>`). |
| ![Uncomment selected](img/screenshots/i_Editwin_uncommenttext.png) | Uncomment selected text | Removes the comment symbol (`⍝`) at the beginning of the line in which the cursor is positioned. If text has been selected, then comment symbols are removed from the start of each selected line of text. Comment symbols that are not at the start of a line of text cannot be removed. Same as the Uncomment command (`<DO>`). |
| ![Search](img/screenshots/i_Editwin_search.png) | Search | Opens the [Search bar](search_and_replace_editwindow.md), enabling a search to be performed. |

### Search and Replace (Edit Window)

The <img src="../img/screenshots/i_intext_search.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> icon in the **Edit** window's toolbar opens the Search bar, enabling a search for every occurrence of a specified string (this can include APL glyphs) to be performed within the code in the Edit window; optionally, a replacement string can be applied on an individual basis.

<img src="../img/screenshots/i_Editwindow_Searchbar.png" title="Placeholder image" alt="Placeholder image" style="border-left-style: solid;border-left-width: 1px;border-left-color: ;border-right-style: solid;border-right-width: 1px;border-right-color: ;border-top-style: solid;border-top-width: 1px;border-top-color: ;border-bottom-style: solid;border-bottom-width: 1px;border-bottom-color: ;" />

The <img src="..img/screenshots/i_Searchbar_togglereplace.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> icon (Toggle replace mode) extends the Search bar to include a Replace field and related icons, as shown below.

<img src="../img/screenshots/i_Editwindow_Searchbar_extended.png" title="Placeholder image" alt="Placeholder image" style="border-left-style: solid;border-left-width: 1px;border-left-color: ;border-right-style: solid;border-right-width: 1px;border-right-color: ;border-top-style: solid;border-top-width: 1px;border-top-color: ;border-bottom-style: solid;border-bottom-width: 1px;border-bottom-color: ;" />

| Icon | Action | Description |
| --- | --- | --- |
| ![Previous](img/screenshots/i_Searchbar_previousmatch.png) | Search for previous match | Positions the cursor at the previous occurrence of the Search text. |
| ![Next](img/screenshots/i_Searchbar_nextmatch.png) | Search for next match | Positions the cursor at the next occurrence of the Search text. |
| ![Find in selection](img/screenshots/i_Searchbar_findinselection.png) | Find in selection | Only searches within the selected text. |
| ![Close](img/screenshots/i_searchbar_close.png)| Close | Closes the Search bar. |
| ![Replace](img/screenshots/i_Searchbar_replace.png) | Replace | Replaces the selected text in the Edit window with the text specified in the Replace field of the Search bar and highlights the next match. |
| ![Replace all](img/screenshots/i_Searchbar_replaceall.png) | Replace all | Replaces all occurrences of the text specified in the Find field of the Search bar with that specified in the Replace field of the Search bar. |

The *Find* field includes three filters, as detailed below. Any combination of these filters can be applied when performing a search.

| Icon | Action | Description |
| --- | --- | --- |
|  ![Match case](img/screenshots/i_searchbar_matchcase.png)| Match case | Applies a case-sensitive filter so that only occurrences that match the case of the string in the Find field are highlighted. |
|  ![Whole word](img/screenshots/i_searchbar_matchwholeword.png)| Match whole word | Only highlights whole words that match the string in the Find field. Note: some glyphs are treated as punctuation when identifying "whole words", for example, `; : , { } [ ] ( )` |
| ![Regex](img/screenshots/i_searchbar_useregularexpression.png) | Use regular expression | Allows regular expressions to be specified in the Find field. |

---
**To search for a string**

1. Enter the string to search for in the Find field in one of the following ways:
    - Press the Search button <img src="../img/screenshots/i_intext_search.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> and enter the string directly in the Find field.
    - Enter the *Search* command (`<SC>`) and enter the string directly in the *Find* field.
    - Select the string in the Trace window and enter the Search command (`<SC>`) or press the Search button ; the selected string is copied to the Find field.

    All occurrences of the specified string are highlighted in the Edit window and the number of occurrences is displayed to the right of the Find field. If the content of the Edit window is sufficiently long for there to be a vertical scroll bar, then the locations of occurrences of the specified string within the entire content are identified by yellow marks overlaid on the scroll bar.

2. Press the <kbd>Enter</kbd> key to select the first occurrence of the search string after the last position of the cursor.
3. Press the **Search for next match** button <img src="../img/screenshots/i_intext_searchnextmatch.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> to advance the selection to the next occurrence of the search string.
4. Repeat step 3 as required (the search is cyclic).
5. Press the <kbd>Esc</kbd> key to exit the search functionality.

---

---
**To replace a string**

1. Do one of the following:
    - Enter the string to search for in the <em>Find</em> field in one of the following ways:
        - Press the **Search** button <img src="../img/screenshots/i_intext_search.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> and enter the string directly in the *Find* field.
        - Enter the Search command (`<SC>`) and enter the string directly in the *Find*</em>* field.
        - Select the string in the **Edit** window and enter the Search command (`<SC>`) or press the **Search** button <img src="../img/screenshots/i_intext_search.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" />; the selected string is copied to the *Find* field.
        
        Press <img src="../img/screenshots/i_Searchbar_togglereplace.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> to extend the Search bar to display the *Replace* field.

        - Enter the Replace command (`<RP>`) and enter the string directly in the *Find* field.
        - Select the string in the **Edit** window and enter the Replace command (`<RP>`); the selected string is copied to the *Find* field and the *Replace* field is displayed.

2. Enter the replacement string directly in the *Replace* field.
3. Press the <kbd>Enter</kbd> key to select the first occurrence of the search string after the last position of the cursor.
4. Do one of the following:
    - Press the <kbd>Enter</kbd> key or the **Replace** button <img src="../img/screenshots/i_Searchbar_replace.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> to replace the selected occurrence of the search string and to advance the selection to the next occurrence of the search string.
    - Press the **Search** for next match** button <img src="../img/screenshots/i_intext_searchnextmatch.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> to leave the selected occurrence of the search string unaltered and to advance the selection to the next occurrence of the search string.
    - Press the **Replace all** button <img src="../img/screenshots/i_Searchbar_replaceall.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> to replace all occurrences of the search string.
5. Press the **Close** button to exit the search and replace functionality.

---

### Exiting the Edit Window

To save changes and close the **Edit** window:

- click <img src="../img/screenshots/i_intext_close.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> in the **Edit** window's tab and select yes when prompted whether to save changes
- click <img src="../img/screenshots/i_intext_quit.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 14px;" /> in the **Edit** window's toolbar
- use the *Escape* command (`<EP>`)

To close the Edit window without saving changes:

- click <img src="../img/screenshots/i_intext_close.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> in the *Edit* window's tab and select no when prompted whether to save changes
- use the *Quit* command (`<QT>`)

## Trace Window

The **Trace** window aids debugging by enabling you to step through your code line by line, display variables in **Edit** windows and watch them change as the execution progresses. Alternatively, you can use the **Session** window and **Edit** windows to experiment with and correct your code.

A **Trace** window can be opened from the Session window by entering `<expression>` `<TC>`. This is an explicit trace and lets you step through the execution of any non-primitive functions/operators in the expression.

By default, Dyalog is also configured to initiate an automatic trace whenever an error occurs, that is, the **Trace** window opens and becomes the active window and the line that caused the execution to suspend is selected. This is controlled by the interpreter configuration parameter `TRACE_ON_ERROR`. For information on configuration parameters, see the Dyalog Installation and Configuration Guide for your operating system:

- [macOS Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20macOS%20Installation%20and%20Configuration%20Guide.pdf)
- [Microsoft Windows Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20Microsoft%20Windows%20Installation%20and%20Configuration%20Guide.pdf)
- [UNIX Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20UNIX%20Installation%20and%20Configuration%20Guide.pdf)

By default, the **Trace** window is docked beneath the **Session** and **Edit** windows. Other than setting/removing [breakpoints](breakpoints.md), **Trace** windows are read-only.

### Toolbar (Trace Window)

The Trace Window's toolbar exposes the following actions:

| Icon | Action | Description |
| --- | --- | --- |
| ![Quit](img/screenshots/s_Tracewin_quitfunction.png) | Quit this function | Cuts the execution stack back one level. |
| ![Toggle line numbers](img/screenshots/i_Editwin_togglelinenumbers.png) | Toggle line numbers | Turns the display of line numbers on/off. |
| ![Execute line](img/screenshots/s_Tracewin_execute.png) | Execute line | Executes the current line and advances to the next line. |
| ![Trace](img/screenshots/s_Tracewin_trace.png) | Trace into expression | Traces execution of the current line and advances to the next line. If the current line calls a user-defined function then this is also traced. |
| ![Stop on next line](img/screenshots/s_Tracewin_stoponnextline.png)  | Stop on next line of calling function | Continues execution of the code in the Trace window from the current line to completion of the current function or operator. If successful, the selection advances to the next line of the calling function (if there is one). |
| ![Continue this thread](img/screenshots/s_Tracewin_continue.png) | Continue execution of this thread | Closes the Trace window and resumes execution of the current application thread from the current line. |
| ![Continue all threads](img/screenshots/s_Tracewin_continueall.png)  | Continue execution of all threads | Closes the Trace window and resumes execution of all suspended threads. |
| ![Interrupt](img/screenshots/s_Tracewin_interrupt.png)  | Interrupt | Interrupts execution with a weak interrupt. |
| ![Edit name](img/screenshots/s_Tracewin_editname.png) | Edit name | Converts the Trace window into an Edit window as long as the cursor is on a blank line or in an empty space. However, if the cursor is on or immediately after an object name that is not the name of the suspended function, then an Edit window for that object name is opened. |
| ![Clear all breakpoints](img/screenshots/s_Tracewin_clearbreakpoints.png) | Clear stops for this object | Clears all breakpoints (resets `⎕STOP` ) on the function(s) in the Edit / Trace windows. |
| ![Search](img/screenshots/i_Editwin_search.png) | Search | Opens the Search bar, enabling a search to be performed. |

### Search (Trace Window)

The <img src="../img/screenshots/i_intext_search.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> icon in the **Trace** window's toolbar opens the Search bar, enabling a search for every occurrence of a specified string (this can include APL glyphs) to be performed within the code in the **Trace** window.

The Search bar exposes the following actions:

| Icon | Action | Description |
| --- | --- | --- |
| ![Previous](img/screenshots/i_Searchbar_previousmatch.png) | Search for previous match | Positions the cursor at the previous occurrence of the Search text. |
| ![Next](img/screenshots/i_Searchbar_nextmatch.png) | Search for next match | Positions the cursor at the next occurrence of the Search text. |
| ![Find in selection](img/screenshots/i_Searchbar_findinselection.png) | Find in selection | Only searches within the selected text. |
| ![Close](img/screenshots/i_searchbar_close.png)| Close | Closes the Search bar. |
| ![Replace](img/screenshots/i_Searchbar_replace.png) | Replace | Replaces the selected text in the **Trace** window with the text specified in the Replace field of the Search bar and highlights the next match. |
| ![Replace all](img/screenshots/i_Searchbar_replaceall.png) | Replace all | Replaces all occurrences of the text specified in the Find field of the Search bar with that specified in the Replace field of the Search bar. |

The *Find* field includes three filters, as detailed below. Any combination of these filters can be applied when performing a search.

| Icon | Action | Description |
| --- | --- | --- |
|  ![Match case](img/screenshots/i_searchbar_matchcase.png)| Match case | Applies a case-sensitive filter so that only occurrences that match the case of the string in the Find field are highlighted. |
|  ![Whole word](img/screenshots/i_searchbar_matchwholeword.png)| Match whole word | Only highlights whole words that match the string in the Find field. Note: some glyphs are treated as punctuation when identifying "whole words", for example, `; : , { } [ ] ( )` |
| ![Regex](img/screenshots/i_searchbar_useregularexpression.png) | Use regular expression | Allows regular expressions to be specified in the Find field. |

---
**To search for a string**

1. Enter the string to search for in the Find field in one of the following ways:
    - Press the Search button <img src="../img/screenshots/i_intext_search.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> and enter the string directly in the Find field.
    - Enter the *Search* command (`<SC>`) and enter the string directly in the *Find* field.
    - Select the string in the **Trace** window and enter the Search command (`<SC>`) or press the Search button ; the selected string is copied to the Find field.

    All occurrences of the specified string are highlighted in the **Trace** window and the number of occurrences is displayed to the right of the Find field. If the content of the **Trace** window is sufficiently long for there to be a vertical scroll bar, then the locations of occurrences of the specified string within the entire content are identified by yellow marks overlaid on the scroll bar.

2. Press the <kbd>Enter</kbd> key to select the first occurrence of the search string after the last position of the cursor.
3. Press the **Search for next match** button <img src="../img/screenshots/i_intext_searchnextmatch.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> to advance the selection to the next occurrence of the search string.
4. Repeat step 3 as required (the search is cyclic).
5. Press the <kbd>Esc</kbd> key to exit the search functionality.

### Exiting the Trace Window

To close the **Trace** window:

- click <img src="../img/screenshots/i_intext_close.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> in the **Trace** window's tab
- click <img src="../img/screenshots/i_intext_quit.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 14px;" /> in the **Trace** window's toolbar
- use the *Escape* command (`<EP>`)
- use the *Quit* command (`<QT>`)
- press the <kbd>Esc</kbd> key

When the **Trace** window is closed, the function within that **Trace** window is removed from the stack. It is possible to close all **Trace/Edit** windows without clearing the stack by selecting the `Window > Close All Windows` menu option or using [2023⌶](https://help.dyalog.com/latest/index.htm#Language/I%20Beam%20Functions/Close%20All%20Windows.htm?Highlight=2023%E2%8C%B6).






























