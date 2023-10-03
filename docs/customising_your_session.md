# Customising Your Session

The appearance and behaviour of a Dyalog Session running through the RIDE can be customised to meet personal preferences and corporate guidelines. Configuration can be performed:

- through the [View menu](#view_menu)
- through the [Preferences dialog box](#preferences_dialog_box)
- using [configuration parameters](#configuration_parameters)

Customisations performed using any of these methods persist between Sessions (they also persist when the installed version of Dyalog is upgraded).

!!!note
    To remove all customisations, reset all RIDE-specific settings and return to the initial default settings, rename/delete the following directory:
    
    - Linux: `$HOME/.config/Ride-<version>`
    - macOS: `$HOME/Library/Application Support/Ride-<version>` (hidden directory – access from the command line)
    - Microsoft Windows: `%APPDATA%\Ride-<version>`

## View Menu

The View menu includes options that enable the appearance of the Dyalog Session running through the RIDE to be changed. Select these options to:

- show/hide the [Language bar](the_dyalog_development_environment.md/#language-bar)
- show/hide the [Status bar](the_dyalog_development_environment.md/#status-bar)
- show/hide the [Workspace Explorer](the_dyalog_development_environment.md/#workspace-explorer)
- show/hide the [debug information window](the_dyalog_development_environment.md/#debug-information-window)
- change the font size in all windows in the Session
- configure the display/functionality of the **Trace/Edit** windows

## Preferences Dialog Box

The Preferences dialog box can be used to customise:

- the automatic formatting of text in an [Edit window](#general-tab)
- the default [keyboard](#keyboard-tab) key mappings for APL glyphs
- the keyboard [shortcuts](#shortcuts-tab) for command codes
- the [style](#colours-tab) for syntax and background colouring
- the [caption](#title-tab) of the **Session** window
- the [menu](#menu-tab) configuration
- the display of floating [Trace/Edit](#windows-tab) windows 

The Preferences dialog box can be opened in any of the following ways:

- selecting the `Edit > Preferences` menu option
- clicking on the <img src="../img/screenshots/b_shortcuts.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" />  button on the right hand side of the Language bar
- entering the Show Preferences command (`<PRF>`)

The Preferences dialog box comprises multiple tabs. The **Print** button enables the contents of the Keyboard and Shortcuts tabs to be printed.

### General Tab

Allows customisation of a variety of features.

---
**To change the general configuration options**

1. Open the General tab.
2. Select the appropriate check boxes and set the variables as required:
    - Highlight matching brackets: `() [] {}`

        Select this to automatically highlight the matching start and end enclosures when positioning the cursor before or after one of them (with contiguous brackets, the bracket immediately before the cursor has its other enclosure highlighted).

    - Auto-close brackets

        Select this to automatically add the paired enclosure when an opening enclosure is entered.

    - Autocompletion

        Select an autocompletion option from the drop-down list (autocompletion makes suggestions when entering the name of, for example, namespaces, variables, functions, operators, user commands and system names). Options include:
    
        - off – disables autocomplete functionality.
        - classic – displays a pop-up window of suggestions based on the characters already entered and the context in which the name is being used.
        - shell – resembles the autocomplete functionality of the Linux bash shell in its use of the tab key.

    - Autocompletion after `<time>` ms
    
        Specify a time interval after which the RIDE's autocompletion functionality is activated.

    - Make suggestions after `<time>` characters
    
        Decides after how many characters the suggestions shall be viewed.

    - Autocomplete control structure with snippets

        Select this to be presented with auto-completion template options for control structures in the Edit window.

    - Highlight matching words

        Select this to highlight all occurrences of a selected string in the same window.

    - Show value tips

        Select this to display the referent of a name. When the cursor is positioned over or immediately after a name, the name is highlighted and its referent is displayed (for example, the value of a variable or the body of a function).

    - Show tips for glyphs

        Select this to show the tooltip for a  glyph. When the cursor is positioned over or immediately after a glyph, the glyph is highlighted and information about it is displayed – this includes the name of the glyph, the keyboard shortcut to enter it, its monadic/dyadic name and examples of its syntax, arguments and result.

    - Auto-start default configuration when RIDE starts

        Ride starts with default configuration.

    - Auto PW

        Select this to display text in the Session window up to the full width of the Session window before wrapping (automatically updates when the Session is resized). Also sets [⎕PW](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/pw.htm) to this value.

    - Persistent history `<number>` lines

        Select this and define the number of lines that are available to recall using the Backward/Undo command (`<BK>`). This specifies how many input lines RIDE remembers from the end of one RIDE session to the start of the next session.

    - Session log size `<number>` lines (0 = unlimited)

        Sets the number of lines in the session log.

    - Show session margin

        Toggles the session indicator margin.

    - Show quit prompt

        Select this to display a confirmation dialog box when exiting the RIDE session.

    - Connect on quit

        Select this to be returned to the RIDE-Dyalog Session dialog box on exiting a Session.

    - Block cursor

        Select this to display the cursor as a solid rectangular block rather than a vertical line.

    - Cursor blinking

        Select a cursor animation from the drop-down list (for example, blink or solid).

    - Highlight current line

        Select an option from the drop-down list to indicate how the line that the cursor is currently positioned on should be emphasised (applies to all windows). Options include:
        
        - none – do not indicate the current line.
        - gutter – display a small grey rectangle in the first column of the line.
        - line – display a grey rectangle around the entire line except the first column.
        - all – gutter and line.

    - Minimap enabled

        Select this to display a dynamic impression of the entire (or very large portion of) contents of the **Session/Edit** window in a column on the right‑hand side of that window. Clicking within the minimap moves the display to that location.

    - Render characters

        Only relevant when Minimap enabled is selected. Select this to use tiny rendered font in the minimap rather than greeking (showing a representation of the text).

    - Show slider

        Only relevant when Minimap enabled is selected. Select an option from the drop-down list to indicate how the currently-displayed content of the window is highlighted in the minimap. Options include:
        
        - always – the current display is always highlighted in the minimap.
        - mouseover – the current display is only highlighted in the minimap when the mouse is positioned over the minimap.

3. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

---

!!!note
    Settings that impact the automatic reformatting of code can cause changes to whitespace – this can be interpreted as changes to the source code. This means that:

    - opening a scripted object in the **Edit** window can cause the source of that object to change (when closing an **Edit** window, you might be prompted to save a function even though you have not made any changes to it).
    - viewing an object can change its file timestamp; source code management systems can subsequently report changes due to the changed file timestamp.
    - source code changes resulting from reformatting will be evident in the results of system functions such as [⎕ATX](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/atx.htm), [⎕SRC](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/src.htm), [⎕CR](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/cr.htm), [⎕VR](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/vr.htm) and [⎕NR](https://help.dyalog.com/latest/index.htm#Language/System%20Functions/nr.htm).

### Keyboard Tab

Allows customisation of the default [keyboard mappings](the_dyalog_development_environment.md/#keyboard-mappings-for-apl-glyphs) for APL glyphs. This is only relevant if a locale-specific keyboard has not been installed.

!!!note
    To replace the keyboard with a locale-specific keyboard in the Session, or to enter Dyalog glyphs in other applications (for example, email), see Dyalog's [APL Fonts and Keyboards](https://www.dyalog.com/apl-font-keyboard.htm) page.

!!!note "Microsoft Windows"
    If you have the Dyalog Unicode IME installed, then the RIDE activates it at start-up when the Also enable Dyalog IME (requires RIDE restart) checkbox is selected (selected by default).
            
    If Dyalog is not installed on the machine that the RIDE is running on, then the Dyalog Unicode IME can be downloaded and installed from Dyalog's [APL Fonts and Keyboards](https://www.dyalog.com/apl-font-keyboard.htm) page.

!!!note "Linux"
    Most Linux distributions released after mid-2012 support Dyalog glyphs by default, for example, openSUSE 12.2, Ubuntu 12.10 and Fedora 17. For more information, see the [Dyalog for UNIX Installation and Configuration Guide](https://docs.dyalog.com/latest/Dyalog%20for%20UNIX%20Installation%20and%20Configuration%20Guide.pdf).

---
**To customise the default keyboard's Prefix key**

1. Open the **Keyboard** tab and select the appropriate keyboard from the drop down list of options.
2. In the **Prefix** key field, enter the new prefix key (by default this is `` ` ``).

    Note: in locales where `` ` `` is a dead key, `$` is a viable alternative.

    Be careful when selecting a new prefix key - although there are no restrictions, choosing certain keys (for example, alphanumeric characters) would restrict the information that could be entered in a Session. 

3. Click OK to save your changes and close the **Preferences** dialog box, Apply to save your changes without closing the **Preferences** dialog box or Cancel to close the **Preferences** dialog box without saving your changes.

---

---
**To customise the default keyboard's key mappings**

1. Open the **Keyboard** tab and select the appropriate keyboard from the drop down list of options.
2. In the image of a keyboard, click on the glyph to be replaced (bottom right of the key for unshifted mode and top right of the key for shifted mode).
3. Enter the glyph to replace the selected glyph with.
4. Repeat steps 2 and 3 until the key mappings are as required.
5. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

---

Your selection of keyboard key mappings is unrestricted – you can choose to map the same glyph to multiple keys or have glyphs that are not represented on the keyboard at all. For example, when dealing with dfns on a Danish keyboard, it might be convenient to map `{` and `}` to a simpler key combination.

### Shortcuts Tab

Allows customisation of the [keyboard shortcuts](keyboard_shortcuts.md) for command codes. Multiple shortcuts can be defined for any command code, but each shortcut must be unique.

---
**To change the keyboard shortcut for a command code**

1. Open the **Shortcuts** tab.
2. Locate the command code for which you want to define a new keyboard shortcut. This can be done by scrolling through the list of possible command codes or by entering a string in the Search field. If a string is entered in the Search field then a dynamic search of both the command codes and descriptions is performed.
3. Optionally, delete any existing shortcuts for the command by clicking the red cross to the right of the shortcut.
4. Optionally, add a new shortcut. To do this:
    - Click the plus symbol that appears to the right of any existing shortcuts when the shortcut is moused over.
    
        A field in which to enter the shortcut is displayed.

    - In this field, enter the keystrokes to map to this action. The field closes when the keystrokes have been entered and the new shortcut is displayed on the **Shortcuts** tab.

        If the keystrokes that you enter are already used for a different command code, then both occurrences will be highlighted and you should remove any duplicate entries (an error message will be displayed if you attempt to apply/save settings that contain duplicate entries).

---

The tooltip showing keyboard shortcuts for command codes (obtained by positioning the cursor over the <img src="../img/screenshots/b_shortcuts.png" style="margin-left: 3px;margin-right: 3px;margin-bottom: 0px;height: 12px;" /> button on the right hand side of the Language bar) is dynamically updated to any customisation.

### Style Tab

Allows customisation of the syntax colouring. Several schemes are provided, any of which can be used as they are or further customised.

---
**To change the syntax colouring to a predefined scheme**

1. Open the **Style** tab.
2. In the **Scheme** field, select the syntax colouring scheme that you want to use. When a scheme is selected, the example shown is updated to use that colour scheme.
3. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

---

---
**To define a new syntax colouring scheme**

1. Open the **Style** tab.
2. In the **Scheme** field, select the syntax colouring scheme that is closest to the scheme that you want to define. When a scheme is selected, the example shown is updated to use that colour scheme.
3. Click **Clone & Edit**.

    A copy is made of the selected scheme and additional options are displayed to allow customisation of the scheme's name and syntax colouring.

4. Define your colour scheme. To do this:

    - Select the element that you would like to change the display of from the drop-down list or by clicking in the example. The customisation options reflect the current settings for the selection made. Some elements have a limited set of options, for example, the cursor element has no bold/italic/underline option.
    - Select a foreground colour and background (highlighting) colour for that syntax as required. If a background colour is selected, then the slide bar can be used to set its transparency.
    - Select the appropriate check boxes to make that syntax bold, italic or underlined as required.
    - Repeat as required.

5. Optionally, rename your colour scheme. To do this:
    - Click **Rename**.

        The name in the **Scheme** field becomes editable.

    - Edit the name in the **Scheme** field.
6. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

---

### Title Tab

Allows customisation of the caption at the top of the Session.

---
**To change the caption**

1. Open the **Title** tab.
2. In the **Window title** field, enter the new name for the Session. Some variable options that can be included are listed beneath this field – clicking on these inserts them into the **Window title** field.
3. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

---

The default value is `{CAPTION}`, which is the same as `{WSID}` by default.

Changing this to `{WSID} – {HOST}:{PORT} (PID: {PID})` gives a different result on every machine. For example:

    /Users/nick/myws.dws – 127.0.0.1:4502 (PID: 293)

Changing this to `{CHARS} {BITS}` gives information that could be the same on multiple machines. For example:

    Unicode 64

### Menu Tab

Allows customisation of the menu options in the menu bar.

!!!warning
    Great care should be taken when customising the menu options; although the ability to make changes is provided, it is not an activity that Dyalog Ltd supports.

    If menu options are customised, then updates to menu items are ignored when updating the installed version of RIDE (this can be avoided by resetting the menu options before upgrading RIDE).

Top-level options (menu names in the menu bar) can be:

- created
- renamed
- reordered
- deleted

Options within each of the menus can be:

- moved to be under a different menu name in the menu bar
- reordered under the same menu name in the menu bar
- renamed
- deleted

Changes do not take effect until the next time a Dyalog Session is started through the RIDE.

### Trace/Edit Tab

Allows customisation of the size and position of floating **Trace/Edit** windows.

To change the size/position of floating **Trace/Edit** windows

1. Open the Trace/Edit tab.
2. Select the appropriate check boxes and set the variables as required:
    - Double click to edit

        Select this to open the Edit window when double-clicking within a word rather than selecting/highlighting the whole word.

    - Show toolbar in editor/trace windows

        Select this to display the toolbar in the Trace/Edit windows.

    - Floating windows
    
        Toggles whether new **Edit** and **Trace** windows are docked inside the Session or floating (undocked). The remaining fields on this tab are only relevant if windows are floating, that is, this option is selected.

    - Include filename in editor title

        Select this to include an object's associated filename in the caption at the top of the Edit window.

    - Single floating window
    
        Select this to display a single floating window with multiple tabs for different **Trace/Edit** windows. If this option is not selected, then multiple floating windows are displayed for individual **Trace/Edit** windows.

    - Remember previous window position
    
        Select this to open new floating windows in the positions that were occupied by previously-opened windows when they were closed. The location of the first floating window opened persists between sessions.

    - Size width and height
    
        Specifies the width and height of new **Trace/Edit** windows.

    - Posn x and y
    
        Specifies the x-y co-ordinates of the screen position for the top left corner of the first **Trace/Edit** window opened.

    - Offset x and y
    
        Specifies the x-y offsets for the top left corner of **Trace/Edit** windows opened relative to the previously-opened window. Only relevant if Single floating window is not selected.

    - Indent content when an editor is opened
		
        Select this to apply the indentation rules to the contents of an Edit window when it is opened.

    - Handle formatting through the interpreter

        Select this to use the interpreter to reformat code. This is useful to avoid formatting changes that could be detected by source code management systems when the RIDE is used to maintain a body of code that is also edited directly using the interpreter.

    - Auto-indent `<number>` spaces

        Only relevant when Handle formatting through the interpreter is not selected. Select this and define the number of spaces by which each level of nested code should be indented relative to the previous level of indentation in the Edit window. If not selected, code in the Edit window will be left justified.

        - in methods:  `<number>`  spaces

            Only relevant when Handle formatting through the interpreter is not selected. Select this and define the number of spaces by which the contents of tradfns should be indented relative to the start/end `∇` glyphs.

    - Indent lines that contain only a comment

        Only relevant when Handle formatting through the interpreter is not selected. Select this to apply the appropriate indentation to lines that start with the `⍝` glyph. If this is not selected, then lines that start with the `⍝` glyph remain as positioned by the user.

  	- Saved Responses

		Allows saved option selections to be deleted.

		When using Link, options selected in dialog boxes are recorded in this tab. For example, saving file content opens a dialog box that offers options of fixing as code in the workspace, saving the file to disk, or discarding changes; the selected option for this file (or, optionally, all files with the same file extension) is recorded in this tab.

		---
		**To delete a previously-saved option selection for a file**

		1. Open the **Saved Responses** tab.
		2. Select the file for which you want to delete the saved option.
		3. Click **Delete**.
		4. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

		---

1. Click **OK** to save your changes and close the **Preferences** dialog box, **Apply** to save your changes without closing the **Preferences** dialog box or **Cancel** to close the **Preferences** dialog box without saving your changes.

---

## Configuration Parameters

Some customisation can be performed using configuration parameters outside a Session. For details of other configuration parameters that can be set, and the syntax used to set them, see the Dyalog for <operating system> Installation and Configuration Guide specific to the operating system that you are using.

!!!warning
    Changes made to configuration parameters in the **dyalog.config** file only impact local interpreters (that is, interpreters that are configured by that file) and do not impact interpreters that the RIDE can connect with on other machines.
























