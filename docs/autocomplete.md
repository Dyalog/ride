



### Autocomplete


Applicable in the Session window and the Edit window


The RIDE includes autocomplete functionality for names to reduce the likelihood of errors when including them in an expression (and to save the user having to enter complete names or remember cases for case-sensitive  names).


As a name is entered, the RIDE displays a pop-up window of suggestions based on the characters already entered and the context in which the name is being used.


For example, if you enter a `⎕` character, the pop-up list of suggestions includes all the system names (for example, system functions and system variables). Entering further characters filters the list so that only those system functions and variables that start with the exact string entered are included.


When you start to enter a name in the Session window, the pop-up list of suggestions includes all the namespaces, variables, functions and operators that are defined in the current namespace. When you start to enter a name in the Edit window, the pop-up list of suggestions also includes all names that are localised in the function header.


To select a name from the pop-up list of suggestions, do one of the following:

- click the mouse on the name in the pop-up list
- use the right arrow key to select the top name in the pop-up list
- use the up and down arrow keys to navigate through the suggestions and the right arrow key or the TAB key to enter the currently-highlighted name

The selected name is then completed in the appropriate window.


This feature can be disabled or customised in the General tab of the Preferences dialog box (see [Section ](general_tab.md#)).


