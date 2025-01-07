// Raf = requestAnimationFrame

function debounceRaf(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("Expected a function");
  }
  let rafId;
  return function (...args) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => fn.apply(this, args));
  };
}

(function () {
  const locationText = document.getElementById("location-text");
  if (!locationText) return;

  function updateLocationText() {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) {
      locationText.textContent = "Start";
      return;
    }
    // Inline sanitization
    const div = document.createElement("div");
    div.textContent = rawHash;
    const sanitized = div.innerHTML;
    // Encode and capitalize
    const encoded = encodeURIComponent(sanitized);
    locationText.textContent =
      encoded.charAt(0).toUpperCase() + encoded.slice(1);
  }

  document.addEventListener("DOMContentLoaded", updateLocationText, {
    once: true,
  });

  window.addEventListener("hashchange", debounceRaf(updateLocationText));
})();
