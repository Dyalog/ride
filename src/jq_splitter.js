/* eslint-disable no-underscore-dangle */
// based on http://methvin.com/splitter (which is dual-licensed MIT,GPL)
$.fn.splitter = function splitter(args) {
  const opt = args || {};
  const A = 'active'; // css class
  const h = +(opt.type === 'h'); // horizontal?
  const TL = h ? 'Top' : 'Left';
  const BR = h ? 'Bottom' : 'Right';
  const tl = h ? 'top' : 'left';
  const wh = h ? 'width' : 'height';
  const hw = h ? 'height' : 'width';
  const pyx = h ? 'pageY' : 'pageX';
  const mhw = `min-${hw}`;
  const Mhw = `max-${hw}`;
  const vhsb = h ? 'vsplitbar' : 'hsplitbar';
  const rsz = `${'en'[h]}-resize`;
  const owh = h ? 'offsetWidth' : 'offsetHeight';
  const ohw = h ? 'offsetHeight' : 'offsetWidth';
  return this.each(function init() {
    const $s = $(this);
    const $p = $('>*', $s).css({
      position: 'absolute',
      zIndex: 1,
      '-moz-outline-style': 'none',
    }); // $s:splitter,$p:panes
    const $a = $p.eq(0);
    const $b = $p.eq(1); // $a:left/top,$b:right/bottom
    const $f = $('<a href=javascript:void(0)></a>') // focuser element, provides keyboard support
      .attr({ tabIndex: 0 });
    // splitbar element, can be already in the doc or we create one
    const $m = $($p[2] || '<div>').insertAfter($a).append($f).addClass(vhsb)
      .attr({ unselectable: 'on' });
    const resplit = (arg) => {
      const min = Math.min(arg, $a._max, $s._DA - $m._DA - $b._min);
      const p = Math.max($a._min, $s._DA - $b._max, min); // fit pane size limits
      // resize/position the two panes:
      $m._DA = $m[0][ohw];
      $m.css(tl, p).css(wh, $s._DF);
      $a.css(tl, 0).css(hw, p).css(wh, $s._DF);
      $b.css(tl, p + $m._DA).css(hw, $s._DA - $m._DA - p).css(wh, $s._DF);
      $p.trigger('resize');
    };
    const doSplit = (e) => { resplit($a._posSplit + e[pyx]); };
    const endSplit = () => {
      $m.removeClass(A);
      $p.css('-webkit-user-select', 'text');
      $(document).off('mousemove', doSplit).off('mouseup', endSplit);
    };
    const startSplit = (e) => {
      $p.css('-webkit-user-select', 'none');
      $m.addClass(A);
      $a._posSplit = $a[0][ohw] - e[pyx];
      $(document).on('mousemove', doSplit).on('mouseup', endSplit);
    };
    $f.on('focus', () => { this.focus(); $m.addClass(A); })
      .on('keydown', (e) => {
        const k = e.which;
        const d = (k === (h ? 40 : 39)) - (k === (h ? 38 : 37));
        d && resplit($a[0][ohw] + 8 * d);
      })
      .on('blur', () => { $m.removeClass(A); });
    $m.on('mousedown', startSplit).css({
      zIndex: 100,
      cursor: rsz,
      position: 'absolute',
      'user-select': 'none',
    });
    // cache several dimensions for speed, rather than re-querying constantly
    $m._DA = $m[0][ohw];
    $s._PBA = 0;
    $s._PBF = 0;
    $a._pane = TL;
    $b._pane = BR;
    const setMinMax = () => {
      [$a, $b].forEach((el) => {
        el._min = Math.max(0, el.css(mhw).replace(/(\d+)px/, '$1') || 0);
        el._max = Math.max(0, el.css(Mhw).replace(/(\d+)px/, '$1') || 0) || 9999;
      });
    };
    setMinMax();
    let p0 = $a[hw](); // initial position
    // eslint-disable-next-line no-restricted-properties
    if (window.isNaN(p0)) { // Solomon's algorithm
      p0 = Math.round(($s[0][ohw] - $s._PBA - $m._DA) / 2);
    }
    $s.on('resize', function resize(e, size) {
      if (e.target !== this) return;
      // determine new width/height of splitter container
      $s._DF = $s[0][owh] - $s._PBF;
      $s._DA = $s[0][ohw] - $s._PBA;
      // bail if splitter isn't visible or content isn't there yet
      if ($s._DF <= 0 || $s._DA <= 0) return;
      // re-divvy the adjustable dimension; maintain size of the preferred pane
      // eslint-disable-next-line no-restricted-properties
      if (!window.isNaN(size)) {
        setMinMax();
        resplit(size);
      } else {
        resplit($a[0][ohw]);
      }
    }).trigger('resize', [p0]);
    $(window).on('resize', (e) => { e.target === window && $s.trigger('resize'); });
  });
};
