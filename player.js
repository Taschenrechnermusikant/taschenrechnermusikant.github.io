/* Inline video player.
 *
 * Every track on the page is a normal link to YouTube, so the site still works
 * with JavaScript switched off. When JavaScript is available, a click opens the
 * video in a lightbox on the page instead of sending the visitor away.
 *
 * Nothing is loaded from YouTube until someone actually presses play, and the
 * player uses youtube-nocookie.com.
 */
(function () {
  "use strict";

  var overlay = null;
  var frame = null;
  var closeButton = null;
  var lastTrigger = null;

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
      '<p class="lightbox-caption"></p>' +
      "</div>";

    document.body.appendChild(overlay);
    frame = overlay.querySelector(".lightbox-frame");
    closeButton = overlay.querySelector(".lightbox-close");

    closeButton.addEventListener("click", close);
    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) close();
    });
  }

  function open(id, title, trigger) {
    if (!overlay) build();

    lastTrigger = trigger;
    overlay.setAttribute("aria-label", "Now playing: " + title);
    overlay.querySelector(".lightbox-caption").textContent = title;

    var iframe = document.createElement("iframe");
    iframe.src =
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(id) +
      "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
    iframe.title = title;
    iframe.allow =
      "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

    frame.textContent = "";
    frame.appendChild(iframe);

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

    if (event.key !== "Tab") return;

    // Keep keyboard focus inside the dialog while it is open.
    var stops = [closeButton, frame.querySelector("iframe")].filter(Boolean);
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
