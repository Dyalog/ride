



## Session Window


The Session window contains:

- the input line – the last line entered in the Session window; this is (usually) the line into which you type an expression to be evaluated.
- a gutter – the left-hand side of the window is a gutter that can include input/output information. Specifically:a small red circle in the gutter is present on every line that has been modified since last pressing Enter. This includes old lines that have been modified as well as new lines. These indicators show which lines will be executed when you subsequently hit Enter, at which point the indicator is removed.a left bracket indicates "groups" of default output (to distinguish it from `⎕` or `⍞` output).
- a small red circle in the gutter is present on every line that has been modified since last pressing Enter. This includes old lines that have been modified as well as new lines. These indicators show which lines will be executed when you subsequently hit Enter, at which point the indicator is removed.
- a left bracket indicates "groups" of default output (to distinguish it from `⎕` or `⍞` output).
- the Session log – a history of previously-entered expressions and the results they produced.

If a log file is being used, then the Session log is loaded into memory when a Dyalog Session is started. When the Dyalog Session is closed, the Session log is written to the log file, replacing its previous contents.


