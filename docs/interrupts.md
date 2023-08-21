



### Interrupts


A Dyalog Session running through the RIDE responds to both strong and weak interrupts.


Entering a strong interrupt suspends execution as soon as possible (generally after completing execution of the primitive currently being processed). A strong interrupt is issued by selecting Actions > Strong Interrupt in the menu options or by entering the Strong Interrupt command (<SI>).


Entering a weak interrupt suspends execution at the start of the next line (generally after completing execution of the statement currently being processed). A weak interrupt is issued by selecting Actions > Weak Interrupt in the menu options or by entering the Weak Interrupt command (<WI>).

When a strong or weak interrupt is issued during code execution, event 1003 or 1002 (respectively) is generated; these can be trapped. For more information, see  `⎕TRAP` in the Dyalog APL Language Reference Guide.

