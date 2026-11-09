/* Inline video player.
 *
 * Every track on the page is a normal link to YouTube, so the site still works
 * with JavaScript switched off. When JavaScript is available, a click opens the
 * video in a lightbox on the page instead of sending the visitor away.
 *
 * The lightbox has previous / next buttons (and the left / right arrow keys)
 * that step through every track in page order. A track that appears twice on
 * the page (Latest and Featured repeat entries from the lists) counts once.
 *
 * Nothing is loaded from YouTube until someone actually presses play, and the
 * player uses youtube-nocookie.com.
 */
(function () {
  "use strict";

  var overlay = null;
  var frame = null;
  var closeButton = null;
  var prevButton = null;
  var nextButton = null;
  var caption = null;
  var lastTrigger = null;

  var playlist = [];
  var current = 0;

  // All tracks in page order, each video ID once.
  function buildPlaylist() {
    var seen = {};
    playlist = [];
    var links = document.querySelectorAll("[data-video]");
    for (var i = 0; i < links.length; i++) {
      var id = links[i].getAttribute("data-video");
      if (seen[id]) continue;
      seen[id] = true;
      playlist.push({
        id: id,
        title: links[i].getAttribute("data-title") || "Video",
        trigger: links[i]
      });
    }
  }

  function indexOfId(id) {
    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i].id === id) return i;
    }
    return -1;
  }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="lightbox-inner">' +
      '<button type="button" class="lightbox-close" aria-label="Close player">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>' +
      "</button>" +
      '<div class="lightbox-frame"></div>' +
      '<div class="lightbox-bar">' +
      '<p class="lightbox-caption"></p>' +
      '<div class="lightbox-nav">' +
      '<button type="button" class="lightbox-step lightbox-prev" aria-label="Previous track">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>' +
      "</button>" +
      '<button type="button" class="lightbox-step lightbox-next" aria-label="Next track">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    frame = overlay.querySelector(".lightbox-frame");
    closeButton = overlay.querySelector(".lightbox-close");
    prevButton = overlay.querySelector(".lightbox-prev");
    nextButton = overlay.querySelector(".lightbox-next");
    caption = overlay.querySelector(".lightbox-caption");

    closeButton.addEventListener("click", close);
    prevButton.addEventListener("click", function () { step(-1); });
    nextButton.addEventListener("click", function () { step(1); });
    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) close();
    });
  }

  function load(index) {
    current = index;
    var item = playlist[index];

    overlay.setAttribute("aria-label", "Now playing: " + item.title);
    caption.textContent = item.title + " · " + (index + 1) + " / " + playlist.length;

    var iframe = document.createElement("iframe");
    iframe.src =
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(item.id) +
      "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
    iframe.title = item.title;
    iframe.allow =
      "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

    frame.textContent = "";
    frame.appendChild(iframe);

    lastTrigger = item.trigger;
  }

  // Move to the previous (-1) or next (1) track, wrapping at either end.
  function step(direction) {
    var next = (current + direction + playlist.length) % playlist.length;
    load(next);
  }

  function open(id, title, trigger) {
    if (!overlay) build();
    buildPlaylist();

    var index = indexOfId(id);
    if (index === -1) {
      playlist.push({ id: id, title: title, trigger: trigger });
      index = playlist.length - 1;
    }

    load(index);
    lastTrigger = trigger;

    overlay.hidden = false;
    document.documentElement.classList.add("is-locked");
    closeButton.focus();
    document.addEventListener("keydown", onKeyDown);
  }

  function close() {
    if (!overlay || overlay.hidden) return;

    overlay.hidden = true;
    frame.textContent = "";
    document.documentElement.classList.remove("is-locked");
    document.removeEventListener("keydown", onKeyDown);

    if (lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus();
    }
    lastTrigger = null;
  }

  function onKeyDown(event) {
    if (event.key === "Escape" || event.key === "Esc") {
      close();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
      return;
    }

    if (event.key !== "Tab") return;

    // Keep keyboard focus inside the dialog while it is open.
    var stops = [closeButton, prevButton, nextButton, frame.querySelector("iframe")].filter(Boolean);
    var first = stops[0];
    var last = stops[stops.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("click", function (event) {
    // Let the browser handle "open in new tab" style clicks normally.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    var target = event.target;
    var trigger = target && target.closest ? target.closest("[data-video]") : null;
    if (!trigger) return;

    event.preventDefault();
    open(
      trigger.getAttribute("data-video"),
      trigger.getAttribute("data-title") || "Video",
      trigger
    );
  });
})();
