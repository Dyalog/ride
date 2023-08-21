# Customising Your Session

The appearance and behaviour of a Dyalog Session running through the RIDE can be customised to meet personal preferences and corporate guidelines. Configuration can be performed:

- through the [View menu](view_menu_customisation.md)
- through the [Preferences dialog box](preferences_dialog_box.md)
- using [configuration parameters](configuration_parameters.md)

Customisations performed using any of these methods persist between Sessions (they also persist when the installed version of Dyalog is upgraded).

To remove all customisations, reset all RIDE-specific settings and return to the initial default settings, rename/delete the following directory:
- Linux: `$HOME/.config/Ride-<version>`
- macOS: `$HOME/Library/Application Support/Ride-<version>` (hidden directory – access from the command line)
- Microsoft Windows: `%APPDATA%\Ride-<version>`

## View Menu

The View menu includes options that enable the appearance of the Dyalog Session running through the RIDE to be changed. Select these options to:

- show/hide the [Language bar](language_bar.md))
- show/hide the [Status bar](status_bar.md))
- show/hide the [Workspace Explorer](workspace_explorer.md))
- show/hide the [debug information window](debug_information_window.md))
- change the font size in all windows in the Session
- configure the display/functionality of the Edit/Trace windows

## Preferences Dialog Box

The Preferences dialog box can be used to customise:

- the automatic formatting of text in an [Edit window](general_tab.md))
- the default [keyboard key mappings](keyboard_tab.md) for APL glyphs
- the keyboard [shortcuts](shortcuts_tab.md) for command codes
- the [saved responses](saved_responses_tab.md) for dialog box options
- the [syntax colouring](colours_tab.md#) and background colour
- the [caption](title_tab.md) of the Session window (see [Section ])
- the display of floating Edit/Trace [windows](windows_tab.md) 

The Preferences dialog box can be opened in any of the following ways:

- selecting the `Edit > Preferences` menu option
- clicking the  icon on the left hand side of the Status bar
- clicking on the  button on the right hand side of the Language bar
- entering the Show Preferences command (`<PRF>`)

The Preferences dialog box comprises multiple tabs. The  button enables the contents of the Keyboard and Shortcuts tabs to be printed.

### General Tab

Allows customisation of a variety of features.

To change the general configuration options

1. Open the General tab.
2. Select the appropriate check boxes and set the variables as required:
- Indent content when an editor is opened

    Select this to apply the indentation rules to the contents of an Edit window when it is opened.
- Handle formatting through the interpreter

    Select this to use the interpreter to reformat code. This is useful to avoid formatting changes that could be detected by source code management systems when the RIDE is used to maintain a body of code that is also edited directly using the interpreter.
- Auto-indent <number> spaces

    Only relevant when Handle formatting through the interpreter is not selected. Select this and define the number of spaces by which each level of nested code should be indented relative to the previous level of indentation in the Edit window. If not selected, code in the Edit window will be left justified.
- in methods:  <number>  spaces

    Only relevant when Handle formatting through the interpreter is not selected. Select this and define the number of spaces by which the contents of tradfns should be indented relative to the start/end `∇` glyphs.
- Indent lines that contain only a comment

    Only relevant when Handle formatting through the interpreter is not selected. Select this to apply the appropriate indentation to lines that start with the `⍝` glyph. If this is not selected, then lines that start with the `⍝` glyph remain as positioned by the user.
- Highlight matching brackets: `() [] {}`

    Select this to automatically highlight the matching start and end enclosures when positioning the cursor before or after one of them (with contiguous brackets, the bracket immediately before the cursor has its other enclosure highlighted).
- Auto-close brackets

    Select this to automatically add the [paired enclosure](paired_enclosures.md) when an opening enclosure is entered.
- Autocompletion

    Select an autocompletion option from the drop-down list (autocompletion makes suggestions when entering the name of, for example, namespaces, variables, functions, operators, user commands and system names). Options include:
    
    - off – disables autocomplete functionality.
    - classic – displays a pop-up window of suggestions based on the characters already entered and the context in which the name is being used (see [Section ](autocomplete.md#)).
    - shell – resembles the autocomplete functionality of the Linux bash shell in its use of the tab key.
    - Autocompletion after `<time>` ms
    
        Specify a time interval after which the RIDE's autocompletion functionality is activated.
    - Autocomplete control structure with snippets
        Select this to be presented with auto-completion template options for control structures in the Edit window.
- Highlight matching words

    Select this to highlight all occurrences of a selected string in the same window.
- Show value tips

    Select this to display the referent of a name. When the cursor is positioned over or immediately after a name, the name is highlighted and its referent is displayed (for example, the value of a variable or the body of a function).
- Show tips for glyphs

    Select this to show the tooltip for a  glyph. When the cursor is positioned over or immediately after a glyph, the glyph is highlighted and information about it is displayed – this includes the name of the glyph, the keyboard shortcut to enter it, its monadic/dyadic name and examples of its syntax, arguments and result.
- Auto PW

    Select this to display text in the Session window up to the full width of the Session window before wrapping (automatically updates when the Session is resized). Also sets `⎕PW` to this value.
- Persistent history `<number>` lines

    Select this and define the number of lines that are available to recall using the Backward/Undo command (`<BK>`). This specifies how many input lines RIDE remembers from the end of one RIDE session to the start of the next session.
- Block cursor

    Select this to display the cursor as a solid rectangular block rather than a vertical line.
- Cursor blinking

    Select a cursor animation from the drop-down list (for example, blink or solid).
- Highlight current line

    Select an option from the drop-down list to indicate how the line that the cursor is currently positioned on should be emphasised (applies to all windows). Options include:none – do not indicate the current line.gutter – display a small grey rectangle in the first column of the line.line – display a grey rectangle around the entire line except the first column.all – gutter and line.
- none – do not indicate the current line.
- gutter – display a small grey rectangle in the first column of the line.
- line – display a grey rectangle around the entire line except the first column.
- all – gutter and line.
- Minimap enabled

    Select this to display a dynamic impression of the entire (or very large portion of) contents of the Session/Edit window in a column on the right‑hand side of that window. Clicking within the minimap moves the display to that location.
- Minimap render characters

    Only relevant when Minimap enabled is selected. Select this to use tiny rendered font in the minimap rather than greeking (showing a representation of the text).
- Minimap show slider

    Only relevant when Minimap enabled is selected. Select an option from the drop-down list to indicate how the currently-displayed content of the window is highlighted in the minimap. Options include:always – the current display is always highlighted in the minimap.mouseover – the current display is only highlighted in the minimap when the mouse is positioned over the minimap.
- always – the current display is always highlighted in the minimap.
- mouseover – the current display is only highlighted in the minimap when the mouse is positioned over the minimap.
- Double click to edit

    Select this to open the Edit window when double-clicking within a word rather than selecting/highlighting the whole word.
- Show quit prompt

    Select this to display a confirmation dialog box when exiting the RIDE session.
- Show toolbar in editor/trace windows

    Select this to display the toolbar in the Edit/Trace windows.
- Connect on quit

    Select this to be returned to the RIDE-Dyalog Session dialog box on exiting a Session.
- Include filename in editor title

    Select this to include an object's associated filename in the caption at the top of the Edit window.
3. Click OK to save your changes and close the Preferences dialog box, Apply to save your changes without closing the Preferences dialog box or Cancel to close the Preferences dialog box without saving your changes.

Settings that impact the automatic reformatting of code can cause changes to whitespace – this can be interpreted as changes to the source code. This means that:

- opening a scripted object in the Edit window can cause the source of that object to change (when closing an Edit window, you might be prompted to save a function even though you have not made any changes to it).
- viewing an object can change its file timestamp; source code management systems can subsequently report changes due to the changed file timestamp.
- source code changes resulting from reformatting will be evident in the results of system functions such as  `⎕AT`, `⎕SRC`, `⎕CR`, `⎕VR` and `⎕NR`.

## Configuration Parameters

There are two configuration parameters that are relevant to the RIDE:

- `RIDE_EDITOR` (set on the machine that the RIDE is running on)
- `RIDE_INIT` (set on the machine that the interpreter is running on)







