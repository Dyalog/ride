



## Entering APL Characters


APL glyphs can be entered in a Dyalog Session running through the RIDE by:

- typing the glyph in the Session window or Edit window using the appropriate key combination (see [Section ](keyboard_key_mappings_for_apl_glyphs.md#)).
- clicking the appropriate glyph on the Language bar (see [Section ](language_bar.md#)) – this inserts that glyph into the active Session/Edit window at the position of the cursor.

When typing a glyph directly rather than using the Language bar, if you pause after entering the prefix key then the autocomplete functionality (see [Section ](autocomplete.md#)) displays a list of all the glyphs that can be produced. If you enter the prefix key a second time then a list of all the glyphs that can be produced is again displayed but this time with the names (formal and informal) that are used for each glyph.


For example:
      `      ⍝ default prefix key

The autocomplete functionality list includes the following for the `⍟` glyph:
⍟ `* ``logarithm⍟ `* ``naturallogarithm⍟ `* ``circlestar⍟ `* ``starcircle⍟ `* ``splat

This means that you can enter the `⍟` glyph by selecting (or directly typing) any of the following:
      `*      ``logarithm      ``naturallogarithm      ``circlestar      ``starcircle      ``splat

As you enter a name, the autocomplete functionality restricts the list of options to those that match the entered name. For example, entering:
      ``ci

restricts the list to:
⍟ `* ``circlestar○ `○ ``circular⌽ `% ``circlestile⊖ `& ``circlebar⍉ `^ ``circlebackslash⍥ `O ``circlediaeresis

