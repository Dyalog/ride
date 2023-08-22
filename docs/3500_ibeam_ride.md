



### 3500⌶ (Send HTML to the RIDE)


Syntax: `R←{X}(3500⌶)Y`


Optionally, `X` is a simple character vector or scalar, the contents of which are used as the caption of an embedded browser window opened by the RIDE client. If omitted, then the caption defaults to "`3500⌶`".


`Y` is a simple character vector of HTML markup, the contents of which are displayed in the embedded browser tab.


`R` identifies whether the write to the RIDE was successful. Possible values are:

- `0` : the write to the RIDE client was successful
- `¯1` : the RIDE client is not enabled

