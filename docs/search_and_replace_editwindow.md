



### Search and Replace (Edit Window)


The  icon in the Edit window's toolbar opens the Search bar, enabling a search for every occurrence of a specified string (this can include APL glyphs) to be performed within the code in the Edit window; optionally, a replacement string can be applied on an individual basis.


The Search bar is shown in [](#editwin_searchbar_default); the icons in the Search bar are detailed in [](#editwin_searchbar_icons)and its icons are detailed below.




The Search bar (default)





The  icon (Toggle replace mode) extends the Search bar to include a Replace field and related icons, as shown in [](#editwin_searchbar_extendeded) below.




The Search bar (extended to include display of the Replace fields)






| Icon | Action | Description |
| --- | --- | --- |
|  | Search for previous match | Positions the cursor at the previous occurrence of the Search text. |
|  | Search for next match | Positions the cursor at the next occurrence of the Search text. |
|  | Find in selection | Only searches within the selected text. |
|  | Close | Closes the Search bar. |
|  | Replace | Replaces the selected text in the Edit window with the text specified in the Replace field of the Search bar and highlights the next match. |
|  | Replace all | Replaces all occurrences of the text specified in the Find field of the Search bar with that specified in the Replace field of the Search bar. |


The Find field includes three filters, as detailed in [](#findfield_filters)below. Any combination of these filters can be applied when performing a search.

| Icon | Action | Description |
| --- | --- | --- |
|  | Match case | Applies a case-sensitive filter so that only occurrences that match the case of the string in the Find field are highlighted. |
|  | Match whole word | Only highlights whole words that match the string in the Find field. Some glyphs are treated as punctuation when identifying "whole words", for example, `; : , { } [ ] ( )` |
|  | Use regular expression | Allows regular expressions to be specified in the Find field. |


To search for a string

1. Enter the string to search for in the Find field in one of the following ways:- Press the Search button  and enter the string directly in the Find field.
- Enter the Search command (<SC>) and enter the string directly in the Find field.
- Select the string in the Trace window and enter the Search command (<SC>) or press the Search button ; the selected string is copied to the Find field.
All occurrences of the specified string are highlighted in the Edit window and the number of occurrences is displayed to the right of the Find field. If the content of the Edit window is sufficiently long for there to be a vertical scroll bar, then the locations of occurrences of the specified string within the entire content are identified by yellow marks overlaid on the scroll bar.

2. Press the Enter key to select the first occurrence of the search string after the last position of the cursor.
3. Press the Search for next match button  to advance the selection to the next occurrence of the search string.
4. Repeat step 3 as required (the search is cyclic).
5. Press the Esc key to exit the search functionality.




To replace a string

1. Do one of the following:
2. Enter the replacement string directly in the Replace field.
3. Press the Enter key to select the first occurrence of the search string after the last position of the cursor.
4. Do one of the following:
5. Press the Close button  to exit the search and replace functionality.




