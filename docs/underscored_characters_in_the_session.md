



#### Underscored Characters in the Session


If the RIDE is connected to a Unicode edition of Dyalog, then underscored characters are displayed correctly in the Session window, Edit windows and Trace windows. If the RIDE is connected to a classic edition of Dyalog, then the following command must be run in every APL Session to enable the underscored alphabet to be displayed correctly:
      ⎕IO←0      ⎕AVU[97+⍳26]←9398+⍳2      2 ⎕NQ '.' 'SetUnicodeTable' ⎕AVU

