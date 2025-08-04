console.log("Content script is running");

function injectGhost() {
  if (document.getElementById("ghost-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "ghost-wrapper";
  wrapper.style.position = "fixed";
  wrapper.style.bottom = "10px";
  wrapper.style.right = "10px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "10px";
  wrapper.style.zIndex = "9999";
  wrapper.style.cursor = "grab";

  const img = document.createElement("img");
  img.id = "ghost-img";
  img.src = chrome.runtime.getURL("ghost.png");
  img.alt = "👻";
  img.style.width = "100px";

  const timer = document.createElement("div");
  timer.id = "ghost-timer";
  timer.innerText = "00:00";
  timer.style.color = "#fff";
  timer.style.fontSize = "18px";
  timer.style.fontWeight = "bold";
  timer.style.background = "rgba(0,0,0,0.7)";
  timer.style.padding = "6px 10px";
  timer.style.borderRadius = "10px";

  // Drag logic for wrapper
  let isDragging = false, offsetX = 0, offsetY = 0;
  wrapper.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - wrapper.getBoundingClientRect().left;
    offsetY = e.clientY - wrapper.getBoundingClientRect().top;
    wrapper.style.cursor = "grabbing";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    wrapper.style.left = `${e.clientX - offsetX}px`;
    wrapper.style.top = `${e.clientY - offsetY}px`;
    wrapper.style.bottom = "auto";
    wrapper.style.right = "auto";
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    wrapper.style.cursor = "grab";
  });

  // Ask background for current time
  chrome.runtime.sendMessage({ type: "get-timer" }, (res) => {
    if (res && typeof res.remainingSeconds === "number") {
      const mins = String(Math.floor(res.remainingSeconds / 60)).padStart(2, "0");
      const secs = String(res.remainingSeconds % 60).padStart(2, "0");
      timer.innerText = `${mins}:${secs}`;
    }
  });

  // Double-click removes wrapper
  wrapper.addEventListener("dblclick", () => {
    wrapper.remove();
    chrome.storage.local.set({ focusSessionActive: false });
  });

  wrapper.appendChild(img);
  wrapper.appendChild(timer);
  document.body.appendChild(wrapper);
}

// Global message listener
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "inject-ghost") injectGhost();

  if (msg.type === "remove-ghost") {
    document.getElementById("ghost-wrapper")?.remove();
  }

  if (msg.type === "broadcast-timer") {
    const timer = document.getElementById("ghost-timer");
    if (timer) {
      const mins = String(Math.floor(msg.remainingSeconds / 60)).padStart(2, "0");
      const secs = String(msg.remainingSeconds % 60).padStart(2, "0");
      timer.innerText = `${mins}:${secs}`;
    }
  }
  if (msg.type === "show-break-overlay") {
    createBreakOverlay(); 
  }
});

function createBreakOverlay() {
  if (document.getElementById("ghost-break-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "ghost-break-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0, 0, 0, 0.7)";
  overlay.style.zIndex = "10000";
  overlay.style.color = "#fff";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.innerHTML = `
    <h2>Time to ghosthunt!</h2>
    <p>Wanna play or take a break?</p>
    <button id="btn-play" style="margin: 10px; padding: 10px 20px; font-size: 16px; cursor: pointer;">Play Game</button>
    <button id="btn-break" style="margin: 10px; padding: 10px 20px; font-size: 16px; cursor: pointer;">Take a Break</button>
    <button id="btn-work" style="margin: 10px; padding: 10px 20px; font-size: 16px; cursor: pointer;">Keep Working</button>
  `;

  document.body.appendChild(overlay);

  // Add event listeners after DOM is updated
  setTimeout(() => {
    const playBtn = document.getElementById("btn-play");
    const breakBtn = document.getElementById("btn-break");
    const workBtn = document.getElementById("btn-work");

    playBtn?.addEventListener("click", () => {
      overlay.remove();
      // TODO: launch game
    });

    breakBtn?.addEventListener("click", () => {
      overlay.remove();

      chrome.runtime.sendMessage({ type: "request-break-minutes" });

      chrome.runtime.onMessage.addListener(function handleResponse(msg) {
        if (msg.type === "respond-break-minutes") {
          chrome.runtime.sendMessage({
            type: "overlay-choice",
            choice: "break",
            breakMinutes: msg.breakMinutes,
          });
          chrome.runtime.onMessage.removeListener(handleResponse);
        }
      });
    });

    workBtn?.addEventListener("click", () => {
      overlay.remove();
      chrome.runtime.sendMessage({ type: "overlay-choice", choice: "work" });
    });
  }, 0);
}

// Auto-inject on reload
chrome.storage.local.get(["focusSessionActive"], (res) => {
  if (res.focusSessionActive) injectGhost();
});