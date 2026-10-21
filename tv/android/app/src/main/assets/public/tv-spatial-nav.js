/**
 * MyStreamFlix Android TV Spatial Navigation Engine (D-Pad Remote Control)
 * Handles directional movement (Up, Down, Left, Right), Select (Enter/OK),
 * Back (Escape/Back button), and automatic horizontal & vertical scrolling.
 */
(function (window, document) {
  "use strict";

  const TVNav = {
    currentFocus: null,
    isInitialized: false,
    backPressTimestamp: 0,

    FOCUS_SELECTOR: [
      ".tv-focusable",
      "button:not([disabled]):not([aria-hidden='true'])",
      "a[href]:not([aria-hidden='true'])",
      "input:not([disabled]):not([type='hidden'])",
      "[tabindex='0']",
      "[data-focusable='true']"
    ].join(", "),

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Bind Remote D-Pad Key Events
      window.addEventListener("keydown", (e) => this.handleKeyDown(e), { capture: true });

      // Observe DOM changes to re-check focus validity
      const observer = new MutationObserver(() => {
        if (!this.currentFocus || !document.body.contains(this.currentFocus) || !this.isVisible(this.currentFocus)) {
          this.focusDefault();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Initial focus after initial render
      setTimeout(() => this.focusDefault(), 300);
      console.log("[MyStreamFlix TV] Spatial Navigation Engine Initialized");
    },

    getAllFocusableElements() {
      const candidates = Array.from(document.querySelectorAll(this.FOCUS_SELECTOR));
      return candidates.filter((el) => this.isVisible(el));
    },

    isVisible(el) {
      if (!el || !el.getBoundingClientRect) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    },

    focusDefault() {
      // Prioritize primary action button, then first focusable element
      const defaultCandidate =
        document.querySelector(".tv-default-focus") ||
        document.querySelector("#tv-hero-play-btn") ||
        document.querySelector(".tv-nav-item.active") ||
        this.getAllFocusableElements()[0];

      if (defaultCandidate) {
        this.setFocus(defaultCandidate);
      }
    },

    setFocus(element) {
      if (!element || element === this.currentFocus) return;

      // Remove focus class from previous
      if (this.currentFocus) {
        this.currentFocus.classList.remove("tv-focused");
        this.currentFocus.dispatchEvent(new CustomEvent("tv-blur", { bubbles: true }));
      }

      this.currentFocus = element;
      element.classList.add("tv-focused");
      if (typeof element.focus === "function") {
        element.focus({ preventScroll: true });
      }

      // Smoothly scroll container to bring focused element into center view
      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });

      element.dispatchEvent(new CustomEvent("tv-focus", { bubbles: true }));
    },

    handleKeyDown(event) {
      const key = event.key || event.code;
      const keyCode = event.keyCode;

      // Handle D-Pad Directions
      if (key === "ArrowUp" || keyCode === 38 || keyCode === 19) {
        event.preventDefault();
        this.move("up");
        return;
      }
      if (key === "ArrowDown" || keyCode === 40 || keyCode === 20) {
        event.preventDefault();
        this.move("down");
        return;
      }
      if (key === "ArrowLeft" || keyCode === 37 || keyCode === 21) {
        event.preventDefault();
        this.move("left");
        return;
      }
      if (key === "ArrowRight" || keyCode === 39 || keyCode === 22) {
        event.preventDefault();
        this.move("right");
        return;
      }

      // Handle Select / Center OK button
      if (key === "Enter" || key === "Select" || keyCode === 13 || keyCode === 23) {
        event.preventDefault();
        this.activateCurrent();
        return;
      }

      // Handle Back Button
      if (key === "Escape" || key === "Backspace" || keyCode === 27 || keyCode === 4) {
        event.preventDefault();
        this.handleBack();
        return;
      }

      // Media keys (Play / Pause)
      if (key === "MediaPlayPause" || keyCode === 85 || keyCode === 179) {
        event.preventDefault();
        const playBtn = document.querySelector("#hud-play-btn") || document.querySelector(".player-play-btn");
        if (playBtn) playBtn.click();
        return;
      }
    },

    activateCurrent() {
      if (!this.currentFocus) {
        this.focusDefault();
        return;
      }
      // Trigger native click or custom event
      this.currentFocus.click();
      this.currentFocus.dispatchEvent(new CustomEvent("tv-select", { bubbles: true }));
    },

    handleBack() {
      // 1. If video player modal is active, close player
      const closePlayerBtn = document.querySelector("#tv-player-close-btn") || document.querySelector(".player-close-btn");
      if (closePlayerBtn && this.isVisible(closePlayerBtn)) {
        closePlayerBtn.click();
        return;
      }

      // 2. If details modal is open, close details modal
      const closeModalBtn = document.querySelector(".tv-modal-close-btn") || document.querySelector(".modal-close-btn");
      if (closeModalBtn && this.isVisible(closeModalBtn)) {
        closeModalBtn.click();
        return;
      }

      // 3. If in another tab, return to Home tab
      const homeNav = document.querySelector("#tv-nav-home");
      if (homeNav && !homeNav.classList.contains("active")) {
        homeNav.click();
        this.setFocus(homeNav);
        return;
      }

      // 4. Double back to exit toast
      const now = Date.now();
      if (now - this.backPressTimestamp < 2500) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
          window.Capacitor.Plugins.App.exitApp();
        } else if (window.navigator && window.navigator.app) {
          window.navigator.app.exitApp();
        }
      } else {
        this.backPressTimestamp = now;
        this.showToast("Tekan Kembali sekali lagi untuk keluar dari MyStreamFlix TV");
      }
    },

    move(direction) {
      if (!this.currentFocus || !this.isVisible(this.currentFocus)) {
        this.focusDefault();
        return;
      }

      const elements = this.getAllFocusableElements();
      const currentRect = this.currentFocus.getBoundingClientRect();
      const currentCenter = {
        x: currentRect.left + currentRect.width / 2,
        y: currentRect.top + currentRect.height / 2
      };

      let bestCandidate = null;
      let minDistance = Infinity;

      for (const el of elements) {
        if (el === this.currentFocus) continue;

        const rect = el.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        const dx = center.x - currentCenter.x;
        const dy = center.y - currentCenter.y;

        // Check if element is in the targeted spatial quadrant
        let isMatch = false;
        if (direction === "left" && dx < -8) isMatch = true;
        if (direction === "right" && dx > 8) isMatch = true;
        if (direction === "up" && dy < -8) isMatch = true;
        if (direction === "down" && dy > 8) isMatch = true;

        if (!isMatch) continue;

        // Directional distance weighting: penalize perpendicular deviation
        let primaryDist = 0;
        let secondaryDist = 0;

        if (direction === "left" || direction === "right") {
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
        } else {
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
        }

        // Weight perpendicular distance 2.5x to favor straight alignments (same row or same column)
        const score = primaryDist + secondaryDist * 2.5;

        if (score < minDistance) {
          minDistance = score;
          bestCandidate = el;
        }
      }

      if (bestCandidate) {
        this.setFocus(bestCandidate);
      }
    },

    showToast(message) {
      const existing = document.querySelector(".tv-toast");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.className = "tv-toast";
      toast.innerHTML = `<span>📺</span> <span>${message}</span>`;
      document.body.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 2500);
    }
  };

  // Expose to window
  window.TVNav = TVNav;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => TVNav.init());
  } else {
    TVNav.init();
  }
})(window, document);
