/* The monkeys above the footer dance to the scrolling.
 *
 * Scrolling is the tempo: every BEAT pixels is one kick drum. The page
 * position is followed with a little lag, so the movement stays smooth
 * however jerky the scrolling is. "Energy" rises with scroll speed and
 * fades when the page rests; it scales how wild the dancing gets, how far
 * the colour ghosts split apart, and whether the monkeys take colour.
 */
(function () {
  var monkeys = document.querySelectorAll(".monkey");
  if (!monkeys.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var BEAT = 150;                      // pixels of scrolling per beat
  var COLORS = ["#e2c93a", "#3ac7c9", "#4cb860", "#c24fb5", "#d0453a", "#3a54c2"];
  var COLOR_GAP = 240;                 // at most ~4 colour changes a second, no strobing

  // One dance style per monkey: tilt, sideways sway, hop height, lean (skew),
  // tempo (1 = on the beat, 2 = double time, 0.5 = half time) and offset.
  var MOVES = [
    { tilt: 13, sway: 7,  hop: 9,  skew: 5, speed: 1,   off: 0.0 },
    { tilt: 7,  sway: 13, hop: 5,  skew: 9, speed: 2,   off: 0.25 },
    { tilt: 4,  sway: 0,  hop: 30, skew: 0, speed: 1,   off: 0.0 },
    { tilt: 16, sway: 9,  hop: 7,  skew: 6, speed: 0.5, off: 0.5 },
    { tilt: 9,  sway: 11, hop: 12, skew: 8, speed: 2,   off: 0.6 }
  ];

  var extra = 0;                       // scrolling done against the end of the page
  var shown = window.scrollY;          // lagging copy of the scroll position
  var energy = 0;
  var running = false;
  var lastTime = 0;
  var lastColorTime = 0;
  var lastBeat = -1;

  function frame(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    var target = window.scrollY + extra;
    var before = shown;
    shown += (target - shown) * (1 - Math.exp(-dt * 9));
    var speed = Math.abs(shown - before) / Math.max(dt, 0.001);   // px per second

    var wanted = Math.min(speed / 1400, 1);
    energy += (wanted - energy) * (1 - Math.exp(-dt * (wanted > energy ? 10 : 2.2)));

    var beats = shown / BEAT;
    var beat = Math.floor(beats);
    var kick = Math.exp(-(beats - beat) * 5);      // 1 on the beat, fading until the next
    var amount = 0.25 + 0.75 * energy;             // a small groove even when slow

    for (var i = 0; i < monkeys.length; i++) {
      var m = MOVES[i];
      var p = (beats * m.speed + m.off) * Math.PI;
      var tilt = Math.sin(p) * m.tilt * amount;
      var sway = Math.sin(p * 0.5) * m.sway * amount;
      var hop = Math.abs(Math.sin(p)) * m.hop * amount;
      var skew = Math.cos(p) * m.skew * energy;
      var squash = kick * 0.16 * amount;           // everybody ducks on the kick
      monkeys[i].style.transform =
        "translate(" + sway.toFixed(2) + "%," + (-hop).toFixed(2) + "%) " +
        "rotate(" + tilt.toFixed(2) + "deg) skewX(" + skew.toFixed(2) + "deg) " +
        "scale(" + (1 + squash * 0.6).toFixed(3) + "," + (1 - squash).toFixed(3) + ")";

      var split = energy * 7 * (0.5 + 0.5 * kick);
      monkeys[i].style.filter = split < 0.3 ? "" :
        "drop-shadow(" + split.toFixed(1) + "px 0 0 rgba(58,199,201,0.75)) " +
        "drop-shadow(" + (-split).toFixed(1) + "px 0 0 rgba(194,79,181,0.75))";
    }

    // Colour: a new one on the beat while the dancing is hot, back to plain at rest.
    if (energy > 0.18) {
      if (beat !== lastBeat && now - lastColorTime > COLOR_GAP) {
        lastBeat = beat;
        lastColorTime = now;
        for (var j = 0; j < monkeys.length; j++) {
          monkeys[j].firstElementChild.style.backgroundColor =
            COLORS[(((beat + j * 2) % COLORS.length) + COLORS.length) % COLORS.length];
        }
      }
    } else if (lastBeat !== -1) {
      lastBeat = -1;
      for (var k = 0; k < monkeys.length; k++) monkeys[k].firstElementChild.style.backgroundColor = "";
    }

    if (Math.abs(target - shown) > 0.3 || energy > 0.01) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function wake() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  // At the top or bottom the page cannot move, but the wheel, the finger and
  // the keys still can. That pushing is added on, so the dance goes on.
  function atEnd(direction) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return direction > 0 ? window.scrollY >= max - 1 : window.scrollY <= 0;
  }

  function push(delta) {
    if (!delta || !atEnd(delta)) return;
    extra += delta;
    wake();
  }

  window.addEventListener("scroll", wake, { passive: true });

  window.addEventListener("wheel", function (event) {
    var unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    push(event.deltaY * unit);
  }, { passive: true });

  var touchY = null;
  window.addEventListener("touchstart", function (event) {
    touchY = event.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchmove", function (event) {
    var y = event.touches[0].clientY;
    if (touchY !== null) push(touchY - y);
    touchY = y;
  }, { passive: true });

  window.addEventListener("keydown", function (event) {
    var steps = { ArrowDown: 40, ArrowUp: -40, PageDown: 300, PageUp: -300, " ": 300 };
    if (document.documentElement.classList.contains("is-locked")) return;
    if (steps[event.key]) push(event.shiftKey && event.key === " " ? -300 : steps[event.key]);
  });
  wake();
})();
