export default function inWin(id, s) {
  const w = D.ide.wins[id];
  s.replace(/<(.+?)>|(.)/g, (_, x, y) => {
    y ? w.insert(y) : D.commands[x] && D.commands[x](w.me);
  });
}
