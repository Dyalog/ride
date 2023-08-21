



### General Tab


Allows customisation of a variety of features.


To change the general configuration options

1. Open the General tab.
2. Select the appropriate check boxes and set the variables as required:- Indent content when an editor is openedSelect this to apply the indentation rules to the contents of an Edit window when it is opened.
- Handle formatting through the interpreterSelect this to use the interpreter to reformat code. This is useful to avoid formatting changes that could be detected by source code management systems when the RIDE is used to maintain a body of code that is also edited directly using the interpreter.
- Auto-indent <number> spacesOnly relevant when Handle formatting through the interpreter is not selected. Select this and define the number of spaces by which each level of nested code should be indented relative to the previous level of indentation in the Edit window. If not selected, code in the Edit window will be left justified.in methods:  <number>  spaces
Only relevant when Handle formatting through the interpreter is not selected. Select this and define the number of spaces by which the contents of tradfns should be indented relative to the start/end `∇` glyphs.

- in methods:  <number>  spaces
- Indent lines that contain only a commentOnly relevant when Handle formatting through the interpreter is not selected. Select this to apply the appropriate indentation to lines that start with the `⍝` glyph. If this is not selected, then lines that start with the `⍝` glyph remain as positioned by the user.
- Highlight matching brackets: () [] {}Select this to automatically highlight the matching start and end enclosures when positioning the cursor before or after one of them (with contiguous brackets, the bracket immediately before the cursor has its other enclosure highlighted).
- Auto-close bracketsSelect this to automatically add the paired enclosure when an opening enclosure is entered (see [Section ](paired_enclosures.md#)).
- AutocompletionSelect an autocompletion option from the drop-down list (autocompletion makes suggestions when entering the name of, for example, namespaces, variables, functions, operators, user commands and system names). Options include:off – disables autocomplete functionality.classic – displays a pop-up window of suggestions based on the characters already entered and the context in which the name is being used (see [Section ](autocomplete.md#)).shell – resembles the autocomplete functionality of the Linux bash shell in its use of the tab key.
- off – disables autocomplete functionality.
- classic – displays a pop-up window of suggestions based on the characters already entered and the context in which the name is being used (see [Section ](autocomplete.md#)).
- shell – resembles the autocomplete functionality of the Linux bash shell in its use of the tab key.
- Autocompletion after <time> msSpecify a time interval after which the RIDE's autocompletion functionality is activated.
- Autocomplete control structure with snippetsSelect this to be presented with auto-completion template options for control structures in the Edit window.
- Highlight matching wordsSelect this to highlight all occurrences of a selected string in the same window.
- Show value tipsSelect this to display the referent of a name. When the cursor is positioned over or immediately after a name, the name is highlighted and its referent is displayed (for example, the value of a variable or the body of a function).
- Show tips for glyphsSelect this to show the tooltip for a  glyph. When the cursor is positioned over or immediately after a glyph, the glyph is highlighted and information about it is displayed – this includes the name of the glyph, the keyboard shortcut to enter it, its monadic/dyadic name and examples of its syntax, arguments and result.
- Auto PWSelect this to display text in the Session window up to the full width of the Session window before wrapping (automatically updates when the Session is resized). Also sets `⎕PW` to this value.
- Persistent history <number> linesSelect this and define the number of lines that are available to recall using the Backward/Undo command (<BK>). This specifies how many input lines RIDE remembers from the end of one RIDE session to the start of the next session.
- Block cursorSelect this to display the cursor as a solid rectangular block rather than a vertical line.
- Cursor blinkingSelect a cursor animation from the drop-down list (for example, blink or solid).
- Highlight current lineSelect an option from the drop-down list to indicate how the line that the cursor is currently positioned on should be emphasised (applies to all windows). Options include:none – do not indicate the current line.gutter – display a small grey rectangle in the first column of the line.line – display a grey rectangle around the entire line except the first column.all – gutter and line.
- none – do not indicate the current line.
- gutter – display a small grey rectangle in the first column of the line.
- line – display a grey rectangle around the entire line except the first column.
- all – gutter and line.
- Minimap enabledSelect this to display a dynamic impression of the entire (or very large portion of) contents of the Session/Edit window in a column on the right‑hand side of that window. Clicking within the minimap moves the display to that location.
- Minimap render charactersOnly relevant when Minimap enabled is selected. Select this to use tiny rendered font in the minimap rather than greeking (showing a representation of the text).
- Minimap show sliderOnly relevant when Minimap enabled is selected. Select an option from the drop-down list to indicate how the currently-displayed content of the window is highlighted in the minimap. Options include:always – the current display is always highlighted in the minimap.mouseover – the current display is only highlighted in the minimap when the mouse is positioned over the minimap.
- always – the current display is always highlighted in the minimap.
- mouseover – the current display is only highlighted in the minimap when the mouse is positioned over the minimap.
- Double click to editSelect this to open the Edit window when double-clicking within a word rather than selecting/highlighting the whole word.
- Show quit promptSelect this to display a confirmation dialog box when exiting the RIDE session.
- Show toolbar in editor/trace windowsSelect this to display the toolbar in the Edit/Trace windows.
- Connect on quitSelect this to be returned to the RIDE-Dyalog Session dialog box on exiting a Session.
- Include filename in editor titleSelect this to include an object's associated filename in the caption at the top of the Edit window.
3. Click OK to save your changes and close the Preferences dialog box, Apply to save your changes without closing the Preferences dialog box or Cancel to close the Preferences dialog box without saving your changes.





Settings that impact the automatic reformatting of code can cause changes to whitespace – this can be interpreted as changes to the source code. This means that:

- opening a scripted object in the Edit window can cause the source of that object to change (when closing an Edit window, you might be prompted to save a function even though you have not made any changes to it).
- viewing an object can change its file timestamp; source code management systems can subsequently report changes due to the changed file timestamp.
- source code changes resulting from reformatting will be evident in the results of system functions such as  `⎕AT`, `⎕SRC`, `⎕CR`, `⎕VR` and `⎕NR`.


