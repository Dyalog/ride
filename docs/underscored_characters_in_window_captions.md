



#### Underscored Characters in Window Captions


The RIDE is restricted by the operating system when it comes to displaying underscored characters in window titles (captions). This restriction means that:

- if the APL385 font is installed (and the operating system has been configured to allow the title bar to use it), underscored characters are displayed as circled characters.
- if the APL385 font is not installed, underscored characters are displayed as a white rectangle, a black rectangle containing a question mark, or some other Unicode-compliant substitution.

Example:


Open an Edit window for an object that has an underscored name:
)ed Ⓐ

The Edit window that is opened displays the name correctly, but its title (caption) is displayed incorrectly, as shown below (assuming window is docked):





