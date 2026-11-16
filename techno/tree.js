// Family tree: hover or focus a genre or track to light up its lines,
// everything it comes from and everything that grows out of it.
(function () {
  var svg = document.querySelector('.chart-wrap.tree svg');
  if (!svg) return;
  var paths = Array.prototype.slice.call(svg.querySelectorAll('path[data-up]'));
  var nodes = Array.prototype.slice.call(svg.querySelectorAll('g.n'));
  var up = {}, down = {};
  paths.forEach(function (p) {
    var u = p.getAttribute('data-up'), d = p.getAttribute('data-down');
    (down[u] = down[u] || []).push(d);
    (up[d] = up[d] || []).push(u);
  });
  function walk(start, map, seen) {
    var stack = [start];
    while (stack.length) {
      var k = stack.pop();
      (map[k] || []).forEach(function (n) {
        if (!seen[n]) { seen[n] = 1; stack.push(n); }
      });
    }
    return seen;
  }
  function show(k) {
    var ups = walk(k, up, {}), downs = walk(k, down, {});
    var all = {}; all[k] = 1;
    Object.keys(ups).forEach(function (n) { all[n] = 1; });
    Object.keys(downs).forEach(function (n) { all[n] = 1; });
    svg.classList.add('hl');
    nodes.forEach(function (g) { g.classList.toggle('on', !!all[g.getAttribute('data-k')]); });
    paths.forEach(function (p) {
      var u = p.getAttribute('data-up'), d = p.getAttribute('data-down');
      var onUp = (ups[u] || u === k) && (ups[d] || d === k);
      var onDown = (downs[d] || d === k) && (downs[u] || u === k);
      p.classList.toggle('on', !!(onUp || onDown));
    });
  }
  function clear() {
    svg.classList.remove('hl');
    nodes.concat(paths).forEach(function (el) { el.classList.remove('on'); });
  }
  nodes.forEach(function (g) {
    var k = g.getAttribute('data-k');
    g.addEventListener('mouseenter', function () { show(k); });
    g.addEventListener('mouseleave', clear);
    g.addEventListener('focusin', function () { show(k); });
    g.addEventListener('focusout', clear);
  });
})();
