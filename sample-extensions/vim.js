//To use this extension:
//  copy this file to the userData dir as in https://dyalog.github.io/ride/4.5/customising_your_session:
//  (package.json and package-lock.json are there for reference)
//   - Linux: `$HOME/.config/Ride-<version>`
//   - macOS: `$HOME/Library/Application Support/Ride-<version>` (hidden directory – access from the command line)
//   - Microsoft Windows: `%APPDATA%\Ride-<version>`
//  npm install --prefix /dir/to/this/file monaco-vim
//  export RIDE_JS=/path/to/this/file.js
//before starting RIDE.
$.extend(D.commands, {
  VIM(me) {
    amdRequire(
      [
        "vs/editor/editor.main",
        `${D.el.app.getPath("userData")}/node_modules/monaco-vim/dist/monaco-vim`,
      ],
      (a, MonacoVim) => {
        vimMode = MonacoVim.initVimMode(
          me,
          document.getElementById("sb_vim")
            ? (() => {
                const x = document.getElementById("sb_vim");
                x.replaceChildren();
                return x;
              })()
            : document.getElementById("sb_left").appendChild(
                (() => {
                  const x = document.createElement("div");
                  x.setAttribute("id", "sb_vim");
                  return x;
                })(),
              ),
        );
      },
    );
    me.updateOptions({
      lineNumbers: "relative",
      autoClosingQuotes: "always",
      autoClosingBrackets: "always",
    });
  },
  MIV() { vimMode.dispose(); },
});
D.remDefaultMap = (me) => {
  // hijack to run additional code on startup
  const kbs = me._standaloneKeybindingService;
  kbs.addDynamicKeybinding(
    "-editor.action.insertCursorAtEndOfEachLineSelected",
    null,
    () => {},
  );
  kbs.addDynamicKeybinding("-editor.action.blockComment", null, () => {});
  kbs.addDynamicKeybinding("-editor.action.formatDocument", null, () => {});
  D.commands.VIM(me);
};
$.extend(D.Ed.prototype, {
  setLN(x) {
    // update the display of line numbers and the state of the "[...]" button
    this.me.updateOptions({ lineNumbers: "relative" });
    this.dom.querySelector(".tb_LN").classList.toggle("pressed", !!x);
  },
});
