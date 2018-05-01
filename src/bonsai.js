{
  class Bonsai {
    constructor(e, o) {
      // e:dom element, o:options={children:function(id,callback){...}, click:function(path){...}}
      const bt = this; // bonsai tree
      bt.rebuild = bt.rebuild.bind(bt);
      bt.render = bt.render.bind(bt);
      bt.refresh = bt.refresh.bind(bt);
      bt.childrenCb = o.children;
      bt.dom = e;
      bt.rebuild();

      const toggleNode = (tgt) => {
        if (bt.newNodes) return;
        const a = tgt;
        const node = bt.nodes[a.parentNode.dataset.id];
        if (!node || !node.expandable) return;
        node.expanded = 1 - !!node.expanded; a.textContent = '+-'[+!!node.expanded];
        if (node.expanded) {
          bt.childrenCb(node.id, (children) => {
            node.children = children;
            children.forEach((c) => { bt.nodes[c.id] = c; });
            const selected = a.nextSibling.classList.contains('selected');
            a.parentNode.outerHTML = bt.render(node, selected);
            if (selected) e.getElementsByClassName('selected')[0].focus();
          });
        }
        a.parentNode.className = node.expanded ? '' : 'bt_collapsed';
      };

      const selectNode = (tgt, trg) => { // tgt=target,trg=trigger=1or0
        if (tgt.matches('.bt_text')) {
          const [sel] = e.getElementsByClassName('selected');
          sel && sel.classList.remove('selected');
          tgt.classList.add('selected');
          tgt.focus();
          if (o.click && trg) {
            const path = [];
            let div = tgt.parentNode;
            while (div && div !== e) {
              path.unshift(bt.nodes[div.dataset.id]);
              div = div.parentNode;
            }
            div && o.click(path);
          }
        }
      };

      let clickTimer = 0;
      e.onclick = (event) => {
        clearTimeout(clickTimer);
        if (event.target.matches('.bt_node_expand')) { toggleNode(event.target); }
        clickTimer = setTimeout(() => {
          selectNode(event.target, 1);
        }, 500);
        return !1;
      };

      e.ondblclick = (event) => {
        clearTimeout(clickTimer);
        const ps = event.target.previousSibling;
        if (ps && ps.matches('.bt_node_expand')) {
          toggleNode(ps);
          selectNode(event.target, 0);
        } else { selectNode(event.target, 1); }
        return !1;
      };

      e.onkeydown = (event) => {
        switch (event.which) {
          case 13:// case 37:case 38:case 39:case 40://Enter,Left,Up,Right,Down
            selectNode(event.target, 1);
            break;
          case 40:
          case 38: {
            const sp = [...e.getElementsByTagName('span')].filter(x => !!x.offsetWidth);
            for (let i = 0; i < sp.length; i += 1) {
              if (sp[i].classList.contains('selected')) {
                selectNode(sp[Math.max(0, Math.min(sp.length - 1, (i + event.which) - 39))]); break;
              }
            }
            return !1;
          }
          case 37: case 39: {
            const sel = e.getElementsByClassName('selected')[0];
            const left = event.which === 37;
            if (!!bt.nodes[sel.dataset.id].expanded === left) toggleNode(sel.previousSibling);
            else if (left) { selectNode(sel.parentNode.parentNode.getElementsByClassName('bt_text')[0]); }
            return !1;
          }
          case 116:// F5
            bt.refresh();
            break;
          default: break;
        }
        return !1;
      };
    }

    focus() {
      const [sel] = this.dom.getElementsByClassName('selected');
      sel && sel.focus();
    }

    render(node, selected) {
      const bt = this;
      let children = '';
      let expandable = '<a class=bt_node_indent></a>';
      if (node.expanded) children = node.children.map(x => bt.render(x)).join('');
      if (node.expandable) expandable = `<a class=bt_node_expand>${'+-'[+!!node.expanded]}</a>`;

      return `<div data-id="${node.id}">` +
        `${expandable}<span tabIndex=-1 data-id=${node.id}` +
        ` class="bt_icon_${node.icon} bt_text ${node.selected || selected ? 'selected' : ''}">` +
        `${node.text}</span>${children}</div>`;
    }

    rebuild() {
      const bt = this;
      bt.nodes = {
        0: {
          id: 0,
          text: '',
          expanded: 1,
        }
      };
      bt.refresh();
    }

    refreshNode(node) {
      const bt = this;
      const oldNode = bt.nodes[node.id];
      bt.newNodes[node.id] = node;
      if (oldNode && oldNode.text === node.text && oldNode.expanded && node.expandable) {
        bt.pendingCalls += 1;
        bt.childrenCb(node.id, (children) => {
          node.expanded = 1;
          node.children = children;
          children.forEach(bt.refreshNode.bind(bt));
          bt.pendingCalls -= 1;
          !bt.pendingCalls && bt.replaceTree();
        });
      }
    }

    refresh() {
      const bt = this;
      if (bt.newNodes) return;
      bt.newNodes = {};
      bt.pendingCalls = 0;
      bt.refreshNode({
        id: 0,
        text: '',
        expandable: 1,
        icon: '',
      });
    }

    replaceTree() {
      const bt = this;
      if (!bt.newNodes) return;
      const [sel] = bt.dom.getElementsByClassName('selected');
      const hasFocus = !!$(bt.dom).find(':focus').length > 0;
      if (sel) {
        const n = bt.newNodes[sel.dataset.id];
        n && (n.selected = 1);
      }
      bt.dom.innerHTML = bt.newNodes[0].children.map(x => bt.render(x)).join('');
      bt.nodes = bt.newNodes;
      hasFocus && bt.focus();
      delete bt.newNodes;
    }
  }
  D.Bonsai = Bonsai;
}
