// workspace explorer
{
  class WSE {
    constructor() {
      const pending = {};
      this.pending = pending;
      const pendingValueTip = {};
      this.pendingValueTip = pendingValueTip;
      this.dom = I.wse;
      this.dom.hidden = 0;
      this.bt = new D.Bonsai(this.dom, {
        children(id, callback) {
          pending[id] = callback.bind(this);
          D.send('TreeList', { nodeId: id });
        },
        click(path) {
          D.send('Edit', { win: 0, pos: 0, text: path });
        },
        valueTip(node, callback){
          pendingValueTip[node.id] = callback.bind(this);
          D.ide.getValueTip('wse', node.id, { // ask interpreter
            win: 0,
            line: node.path,
            pos: 0,
            maxWidth: 200,
            maxHeight: 100,
          });  
        }
      });
    }

    focus() {
      this.bt.focus();
    }

    replyTreeList(x) { // handle response from interpreter
      const f = this.pending[x.nodeId];
      if (!f) return;
      f((x.nodeIds || []).map((c, i) => ({
        // x.classes uses constants from http://help.dyalog.com/17.0/Content/Language/System%20Functions/nc.htm
        id: c || `leaf_${x.nodeId}_${i}`,
        text: x.names[i],
        value: '',
        expandable: !!c,
        icon: `${Math.abs(x.classes[i])}`.replace('.', '_'),
      })));
      delete this.pending[x.nodeId];
    }

    refresh() {
      this.bt.refresh();
    }

    valueTip(nodeId, x) { // handle response from interpreter
      const f = this.pendingValueTip[nodeId];
      if (!f) return;
      f(x);
      delete this.pendingValueTip[nodeId];
    }

    autoRefresh(ms) {
      if (ms && !this.refreshTimer) {
        this.refreshTimer = setInterval(this.bt.refresh, ms);
      } else if (!ms && this.refreshTimer) {
        clearInterval(this.refreshTimer); delete this.refreshTimer;
      }
    }
  }
  D.WSE = WSE;
}
