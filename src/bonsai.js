{
  class Bonsai {
    constructor(e, o) {
      // e:dom element, o:options={children:function(id,callback){...}, click:function(path){...}}
      const bt = this; // bonsai tree
      bt.rebuild = bt.rebuild.bind(bt);
      bt.render = bt.render.bind(bt);
      bt.refresh = bt.refresh.bind(bt);
      bt.childrenCb = o.children;
      bt.valueTipCb = o.valueTip;
      bt.dom = e;
      bt.rebuild();

      const toggleNode = (tgt) => {
        if (bt.newNodes) return;
        const a = tgt;
        const nodeElement = a.parentNode.parentNode;
        const node = bt.nodes[nodeElement.dataset.id];
        if (!node || !node.expandable) return;
        node.expanded = 1 - !!node.expanded; a.textContent = '+-'[+!!node.expanded];
        nodeElement.className = node.expanded ? '' : 'bt_collapsed';
        if (node.expanded) {
          bt.childrenCb(node.id, (children) => {
            const selected = a.nextSibling.classList.contains('selected');
            node.children = children;
            children.forEach((c) => { 
              bt.nodes[c.id] = c;
              c.depth = node.depth + 1;
              c.path = node.path ? `${node.path}.${c.text}` : c.text;
              bt.requestValueTip(c);        
            });
            if (selected) e.getElementsByClassName('selected')[0].focus();
          });
        } else {
          bt.replaceTree();
        }
      };

      const selectNode = (tgt, trg) => { // tgt=target,trg=trigger=1or0
        if (tgt.matches('.bt_text')) {
          const [sel] = e.getElementsByClassName('selected');
          sel && sel.classList.remove('selected');
          tgt.classList.add('selected');
          tgt.focus();  
          if (o.click && trg) {
            o.click(tgt.dataset.path);
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

      return `<tr data-id="${node.id}">` +
        `<td style="padding-left:${node.depth}em;">${expandable}<span tabIndex=-1 data-id=${node.id} data-path=${node.path}` +
        ` class="bt_icon_${node.icon} bt_text ${node.selected || selected ? 'selected' : ''}">` +
        `${node.text}</span></td><td class="value_tip" title="${node.value.join('\n')}">${node.value[0]}</td></tr>${children}`;
    }

    rebuild() {
      const bt = this;
      bt.nodes = {
        0: {
          id: 0,
          depth: 0,
          path: '',
          text: '',
          value: [''],
          expanded: 1,
        }
      };
      bt.refresh();
    }

    refreshNode(node, path, depth) {
      const bt = this;
      const oldNode = bt.nodes[node.id];
      bt.newNodes[node.id] = node;
      node.depth = depth;
      node.path = path ? `${path}.${node.text}` : node.text;
      bt.requestValueTip(node);
      if (oldNode && oldNode.text === node.text && oldNode.expanded && node.expandable) {
        bt.pendingCalls += 1;
        bt.childrenCb(node.id, (children) => {
          node.expanded = 1;
          node.children = children;
          children.forEach(c => bt.refreshNode(c, node.path, node.depth + 1));
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
        value: [''],
        expandable: 1,
        icon: '',
      }, '', 0);
    }

    replaceTree() {
      const bt = this;
      if (bt.newNodes) {
      const [sel] = bt.dom.getElementsByClassName('selected');
      const hasFocus = !!$(bt.dom).find(':focus').length > 0;
      if (sel) {
        const n = bt.newNodes[sel.dataset.id];
        n && (n.selected = 1);
      }     
      bt.nodes = bt.newNodes;
      hasFocus && bt.focus();
      delete bt.newNodes;
    }
    bt.dom.innerHTML = `<table><tbody>${bt.nodes[0].children.map(x => bt.render(x)).join('')}</tbody></table>`;
  }

    requestValueTip(node) {
      if (node.id < 2) return;
      const bt = this;
      bt.pendingCalls += 1;
      bt.valueTipCb(node, (x) => {
        node.value = x.tip;
        bt.pendingCalls -= 1;
        !bt.pendingCalls && bt.replaceTree();
      });
    }
  }
  D.Bonsai = Bonsai;
}
