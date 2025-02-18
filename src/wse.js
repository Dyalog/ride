// workspace explorer
{
  class WSE {
    constructor() {
      const wse = this;
      const pending = {};
      this.pending = pending;
      const pendingValueTip = {};
      this.pendingValueTip = pendingValueTip;
      this.dom = I.wse;
      this.dom.hidden = 0;
      this.VT_MAX_HEIGHT = 30;
      this.VT_MAX_WIDTH = 100;
      this.bt = new D.Bonsai(this.dom, {
        children(id, callback) {
          pending[id] = callback.bind(this);
          D.send('TreeList', { nodeId: id });
        },
        click(path) {
          D.send('Edit', { win: 0, pos: 0, text: path });
        },
        valueTip(node, callback) {
          const valueTipRequest = {
            handler: callback.bind(this),
            timeoutId: setTimeout((n) => {
              wse.valueTip(n.id, { tip: [''] });
            }, 1000, node),
          };
          pendingValueTip[node.id] = valueTipRequest;
          D.ide.getValueTip('wse', node.id, { // ask interpreter
            win: 0,
            line: node.path,
            pos: 0,
            maxWidth: wse.VT_MAX_WIDTH,
            maxHeight: wse.VT_MAX_HEIGHT,
          });
        },
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
        expandable: !!c,
        icon: `${x.classes[i] < 0 ? 9.1 : Math.abs(x.classes[i])}`.replace('.', '_'),
      })));
      delete this.pending[x.nodeId];
    }

    refresh() {
      this.bt.refresh();
    }

    valueTip(nodeId, x) { // handle response from interpreter
      const valueTipRequest = this.pendingValueTip[nodeId];
      if (!valueTipRequest) return;
      delete this.pendingValueTip[nodeId];
      if (valueTipRequest.timeoutId) {
        clearTimeout(valueTipRequest.timeoutId);
      }
      if (x.tip.length === this.VT_MAX_HEIGHT) {
        x.tip[this.VT_MAX_HEIGHT - 1] = '...';
      }
      x.tip = x.tip.map((line) => D.util.esc(line.length < this.VT_MAX_WIDTH ? line : `${line.substring(0, this.VT_MAX_WIDTH - 3)}...`));
      valueTipRequest.handler(x);
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
