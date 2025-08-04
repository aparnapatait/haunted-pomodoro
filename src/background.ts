let timerId: ReturnType<typeof setInterval> | null = null;
let endTime: number | null = null;
let remainingSeconds: number | null = null;
let isPaused = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.command === 'start') {
    const duration = message.duration * 60 * 1000; // convert to ms
    endTime = Date.now() + duration;
    isPaused = false;
    clearInterval(timerId!);

    timerId = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime! - now) / 1000));
      chrome.runtime.sendMessage({
        type: "update-timer",
        remainingSeconds: remaining,
      });
      broadcastTime();
      if (remaining === 0) {
        chrome.storage.local.set({ breakActive: false });
        clearInterval(timerId!);
        endTime = null;
        timerId = null;
        // Send notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "ghost.png", 
      title: "Pomodoro Complete!",
      message: "Focus time complete! Time to catch ghosts!",
      priority: 2,
    });
    chrome.runtime.sendMessage({ type: "session-complete" });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];
  if (activeTab?.id) {
    chrome.tabs.sendMessage(activeTab.id, { type: "show-break-overlay" });
  }
});
  }
}, 1000);

    sendResponse({ status: 'started' });
  }

  else if (message.command === 'stop') {
    chrome.storage.local.set({ breakActive: false });
    clearInterval(timerId!);
    timerId = null;
    endTime = null;
    remainingSeconds = null;
    isPaused = false;
    sendResponse({ status: 'stopped' });
  }

  else if (message.command === 'pause') {
    if (endTime) {
      remainingSeconds = Math.floor((endTime - Date.now()) / 1000);
      clearInterval(timerId!);
      endTime = null;
      isPaused = true;
      sendResponse({ status: 'paused' });
    } else {
      sendResponse({ status: 'no active timer' });
    }
  }

  else if (message.command === 'resume') {
    if (isPaused && remainingSeconds != null) {
      endTime = Date.now() + remainingSeconds * 1000;
      isPaused = false;

      timerId = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime! - now) / 1000));
        chrome.runtime.sendMessage({
          type: "update-timer",
          remainingSeconds: remaining,
        });
        if (remaining === 0) {
          clearInterval(timerId!);
          endTime = null;
          timerId = null;
        }
      }, 1000);

      sendResponse({ status: 'resumed' });
    } else {
      sendResponse({ status: 'not paused' });
    }
  }

  else if (message.command === 'reset') {
    chrome.storage.local.set({ breakActive: false });
    clearInterval(timerId!);
    timerId = null;
    endTime = null;
    remainingSeconds = null;
    isPaused = false;
    sendResponse({ status: 'reset' });
  }

  else if (message.command === 'getTimeRemaining') {
    if (endTime) {
      const remaining = Math.floor((endTime - Date.now()) / 1000);
      sendResponse(remaining >= 0 ? remaining : 0);
    } else if (isPaused && remainingSeconds != null) {
      sendResponse(remainingSeconds);
    } else {
      sendResponse(null);
    }
  }

  else if (message.command === 'start-break') {
  const duration = message.duration * 60 * 1000;
  endTime = Date.now() + duration;
  isPaused = false;
  clearInterval(timerId!);

  timerId = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime! - now) / 1000));
    chrome.runtime.sendMessage({ type: "update-timer", remainingSeconds: remaining });
    broadcastTime();

    if (remaining === 0) {
      clearInterval(timerId!);
      endTime = null;
      timerId = null;

      chrome.notifications.create({
        type: "basic",
        iconUrl: "ghost.png",
        title: "Break over!",
        message: "Time to lock in and hunt more ghosts!",
        priority: 2,
      });
      // Optionally: start next focus session automatically
    }
  }, 1000);

  sendResponse({ status: 'break-started' });
}


  return true; 
});
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === "get-timer") {
    const currentRemaining = endTime
      ? Math.floor((endTime - Date.now()) / 1000)
      : remainingSeconds != null
      ? remainingSeconds
      : 0;
    sendResponse({ remainingSeconds: currentRemaining });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg.type === "start-focus-session") {
    // DEBUGGING
    console.log("Received start-focus-session");
    chrome.storage.local.set({ focusSessionActive: true });
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "inject-ghost" });
        }
      }
    });
  }

  if (msg.type === "stop-focus-session") {
    chrome.storage.local.set({ focusSessionActive: false });
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "remove-ghost" });
        }
      }
    });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg.type === "overlay-choice") {
    if (msg.choice === "break") {
        chrome.storage.local.set({ focusSessionActive: false, breakActive: true });
        console.log("set break to is active");
        const breakMinutes = msg.breakMinutes ?? 5;
        const duration = breakMinutes * 60 * 1000;

        endTime = Date.now() + duration;
        isPaused = false;
        clearInterval(timerId!);

        timerId = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime! - now) / 1000));
          chrome.runtime.sendMessage({ type: "update-timer", remainingSeconds: remaining });
          broadcastTime();

          if (remaining === 0) {
            clearInterval(timerId!);
            endTime = null;
            timerId = null;

            chrome.notifications.create({
              type: "basic",
              iconUrl: "ghost.png",
              title: "Break over!",
              message: "Time to lock in and hunt more ghosts!",
              priority: 2,
            });
            
            // Check if there are more sessions to do
            chrome.storage.local.get(["remainingSessions", "focusMinutes"], (res) => {
              const remainingSessions = res.remainingSessions || 0;
              if (remainingSessions > 0) {
                // Automatically start next focus session
                chrome.storage.local.set({ focusSessionActive: true, breakActive: false });
                chrome.runtime.sendMessage({ type: "restart-focus-session" });
                const focusMinutes = res.focusMinutes || 25;
                const duration = focusMinutes * 60 * 1000;
                
                endTime = Date.now() + duration;
                isPaused = false;

                timerId = setInterval(() => {
                  const now = Date.now();
                  const remaining = Math.max(0, Math.floor((endTime! - now) / 1000));
                  chrome.runtime.sendMessage({
                    type: "update-timer",
                    remainingSeconds: remaining,
                  });
                  broadcastTime();
                  
                  if (remaining === 0) {
                    chrome.storage.local.set({ breakActive: false });
                    clearInterval(timerId!);
                    endTime = null;
                    timerId = null;
                    chrome.notifications.create({
                      type: "basic",
                      iconUrl: "ghost.png", 
                      title: "Pomodoro Complete!",
                      message: "Focus time complete! Time to catch ghosts!",
                      priority: 2,
                    });
                    chrome.runtime.sendMessage({ type: "session-complete" });
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                      const activeTab = tabs[0];
                      if (activeTab?.id) {
                        chrome.tabs.sendMessage(activeTab.id, { type: "show-break-overlay" });
                      }
                    });
                  }
                }, 1000);
                
                // Inject ghost into all tabs
                chrome.tabs.query({}, (tabs) => {
                  for (const tab of tabs) {
                    if (tab.id && tab.url?.startsWith("http")) {
                      chrome.tabs.sendMessage(tab.id, { type: "inject-ghost" });
                    }
                  }
                });
              } else {
                // All sessions complete
                chrome.storage.local.set({ focusSessionActive: false, breakActive: false });
                chrome.tabs.query({}, (tabs) => {
                  for (const tab of tabs) {
                    if (tab.id) {
                      chrome.tabs.sendMessage(tab.id, { type: "remove-ghost" });
                    }
                  }
                });
              }
            });
          }
        }, 1000);
    }

    if (msg.choice === "work") {
      // Restart focus session logic
      chrome.storage.local.set({ focusSessionActive: true, breakActive: false });
      
      // Get the focus time from storage and restart the timer
      chrome.storage.local.get(["focusMinutes"], (res) => {
        const focusMinutes = res.focusMinutes || 25;
        const duration = focusMinutes * 60 * 1000;
        
        endTime = Date.now() + duration;
        isPaused = false;
        clearInterval(timerId!);

        timerId = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime! - now) / 1000));
          chrome.runtime.sendMessage({
            type: "update-timer",
            remainingSeconds: remaining,
          });
          broadcastTime();
          
          if (remaining === 0) {
            chrome.storage.local.set({ breakActive: false });
            clearInterval(timerId!);
            endTime = null;
            timerId = null;
            chrome.notifications.create({
              type: "basic",
              iconUrl: "ghost.png", 
              title: "Pomodoro Complete!",
              message: "Focus time complete! Time to catch ghosts!",
              priority: 2,
            });
            chrome.runtime.sendMessage({ type: "session-complete" });
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs[0];
              if (activeTab?.id) {
                chrome.tabs.sendMessage(activeTab.id, { type: "show-break-overlay" });
              }
            });
          }
        }, 1000);
      });

      chrome.runtime.sendMessage({ type: "restart-focus-session" });
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (tab.id && tab.url?.startsWith("http")) {
            chrome.tabs.sendMessage(tab.id, { type: "inject-ghost" });
          }
        }
      });
    }
  }
});


function broadcastTime() {
  if (endTime || remainingSeconds != null) {
    const remaining = endTime
      ? Math.floor((endTime - Date.now()) / 1000)
      : remainingSeconds;

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "broadcast-timer",
            remainingSeconds: remaining,
          });
        }
      });
    });
  }
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url) return;

    chrome.storage.local.get(["focusSessionActive", "breakActive", "distractionList"], (res) => {
      const isFocus = res.focusSessionActive === true;
      const isBreak = res.breakActive === true;

      // Only show distraction alerts during active focus sessions (not during breaks or when paused)
      if (!isFocus || isBreak || isPaused) return; 

      chrome.tabs.sendMessage(tabId, { type: "inject-ghost" });

      const distractions: string[] = res.distractionList || [];
      if (distractions.some(domain => tab.url!.includes(domain))) {
        const hostname = new URL(tab.url!).hostname;
        chrome.notifications.create({
          type: "basic",
          iconUrl: "ghost.png",
          title: "👻 Focus Alert!",
          message: `Avoid ${hostname} — it's a distraction!`,
          priority: 2,
        });
      }
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  chrome.storage.local.get(["focusSessionActive", "breakActive", "distractionList"], (res) => {
    const isFocus = res.focusSessionActive === true;
    const isBreak = res.breakActive === true;

    // Only show distraction alerts during active focus sessions (not during breaks or when paused)
    if (!isFocus || isBreak || isPaused) return;

    chrome.tabs.sendMessage(tabId, { type: "inject-ghost" });

    const distractions: string[] = res.distractionList || [];
    if (distractions.some(domain => tab.url!.includes(domain))) {
      const hostname = new URL(tab.url!).hostname;
      chrome.notifications.create({
        type: "basic",
        iconUrl: "ghost.png",
        title: "👻 Focus Alert!",
        message: `Avoid ${hostname} — it's a distraction!`,
        priority: 2,
      });
    }
  });
});