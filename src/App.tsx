import { useState, useEffect } from "react";
import './App.css';
import { startTimer, stopTimer, pauseTimer, resetTimer, getTimeRemaining, resumeTimer } from "./popup";

function App() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [distractions, setDistractions] = useState<string[]>([]);
  const [newURL, setNewURL] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [numSessions, setRemainingSessions] = useState(1);

  // sets how many Pomodoro sessions
  useEffect(() => {
  chrome.storage.local.get(["remainingSessions"], (res) => {
    if (res.remainingSessions !== undefined) {
      setRemainingSessions(res.remainingSessions);
    }
  });
}, []);

  useEffect(() => {
    chrome.storage.local.set({ remainingSessions: numSessions });
  }, [numSessions]);

  // set distraction tabs list
  useEffect(() => {
  chrome.storage.local.get(["distractionList"], (res) => {
    if (res.distractionList) {
      setDistractions(res.distractionList);
    }
  });
}, []);

  useEffect(() => {
    const syncWithBackground = async () => {
      const remaining = await getTimeRemaining();
      if (remaining !== null) {
        setRemainingSeconds(remaining);
        setIsRunning(true);
      }
    };
    syncWithBackground();

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "broadcast-timer") {
        setRemainingSeconds(msg.remainingSeconds);
      }
      if (msg.type === "session-complete") {
      handleSessionComplete(); 
    }

    if (msg.type === "request-break-minutes") {
  chrome.runtime.sendMessage({
    type: "respond-break-minutes",
    breakMinutes: breakMinutes, // current state value
  });
}

    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(async () => {
        const remaining = await getTimeRemaining();
        if (remaining !== null) {
          setRemainingSeconds(remaining);
          if (remaining === 0) {
            clearInterval(interval);
            setIsRunning(false);
            alert("Focus time complete! Time to catch ghosts!");
          }
        } else {
          setIsRunning(false);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const handleSessionComplete = () => {

    chrome.storage.local.get(["remainingSessions"], (res) => {
  const current = res.remainingSessions ?? 1;
  const updated = Math.max(0, current - 1);
  chrome.storage.local.set({ remainingSessions: updated });
});

    if (numSessions >= 1) {
      setRemainingSessions(prev => prev - 1);
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "ghost.png",
        title: "Pomodoro complete",
        message: "All Pomodoro sessions complete!",
        priority: 1,
    });
      setRemainingSessions(0);
    }
  };

  const handleStart = () => {
    startTimer(focusMinutes);
    setIsRunning(true);
    setIsPaused(false);
    chrome.storage.local.set({ focusSessionActive: true });
    chrome.runtime.sendMessage({ type: "start-focus-session" });
    injectGhostToAllTabs();
  };

  const handleStop = () => {
    stopTimer();
    setIsRunning(false);
    setRemainingSeconds(0);
    chrome.runtime.sendMessage({ type: "stop-focus-session" });
    chrome.storage.local.set({ focusSessionActive: false });
  };

  const handlePause = () => {
    pauseTimer();
    setIsPaused(true);
    setIsRunning(false);
    chrome.storage.local.set({ focusSessionActive: false });
  };

  const handleResume = () => {
    resumeTimer();
    setIsPaused(false);
    setIsRunning(true);
    chrome.storage.local.set({ focusSessionActive: true });
  };

  const handleReset = () => {
    resetTimer();
    setIsRunning(false);
    setRemainingSeconds(0);
    chrome.runtime.sendMessage({ type: "stop-focus-session" });
    chrome.storage.local.set({ focusSessionActive: false });
  };

  const addDistraction = () => {
    if (newURL.trim() !== '' && !distractions.includes(newURL)) {
      const updatedList = [...distractions, newURL];
      setDistractions(updatedList);
      setNewURL('');
      chrome.storage.local.set({ distractionList: updatedList });
    }
  };

  const removeDistraction = (urlToRemove: string) => {
     const updatedList = distractions.filter((url) => url !== urlToRemove);
    setDistractions(updatedList);
    chrome.storage.local.set({ distractionList: updatedList });
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleInjectGhost = () => {
  chrome.runtime.sendMessage({ type: "start-focus-session" });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url?.startsWith("http")) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["contentScript.js"],
        });
      }
    }
  });
};

  function injectGhostIntoTab(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["contentScript.js"], 
  });
}

const injectGhostToAllTabs = () => {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url?.startsWith("http")) {
        injectGhostIntoTab(tab.id);
      }
    }
  });
};

  return (
    <div className="container">
      <h1>👻 Haunted Pomodoro</h1>
      <p>Help the ghost queen banish distractions and focus!</p>

      <label>
        Number of Sessions:
        <input
          type="number"
          value={numSessions}
          onChange={(e) => setRemainingSessions(Number(e.target.value))}
          min={1}
        />
      </label>

      <div className="inputs">
        <label>
          Focus Time (mins):
          <input
            type="number"
            value={focusMinutes}
            onChange={(e) => setFocusMinutes(Number(e.target.value))}
          />
        </label>
        <label>
          Break Time (mins):
          <input
            type="number"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="distraction-list">
        <h2>Distraction Tabs</h2>
        <input
          type="text"
          placeholder="e.g. youtube.com"
          value={newURL}
          onChange={(e) => setNewURL(e.target.value)}
        />
        <button onClick={addDistraction}>Add</button>
        <ul>
          {distractions.map((url) => (
            <li key={url}>
              {url} <button onClick={() => removeDistraction(url)}>❌</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="timer-section">
        <h2 className="text-xl mt-6">Focus Timer</h2>
        <div className="text-4xl font-mono my-4">{formatTime(remainingSeconds)}</div>

        {(!isRunning && !isPaused) ? (
          <button onClick={handleStart} className="btn">Start Focus Session</button>
        ) : (
          <div className="flex flex-row gap-2 justify-center">
            <button onClick={isPaused ? handleResume : handlePause} className="btn">
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={handleReset} className="btn">Reset</button>
            <button onClick={handleStop} className="btn">Stop</button>
          </div>
        )}

        <button onClick={handleInjectGhost} style={{ marginTop: '1em' }}>
          Summon GhostPet 👻
        </button>
      </div>


    </div>
  );
}

export default App;


// Next steps: 
// set a break time countdown timer, game is to find x number of ghosts. when you're done, the timer resets, and you can journal what all you've achieved.
// there's an option to make your achievements a creative story.
// When you single click the ghost, it gives you a motivational message! 
// let the ghost change expressions when you switch to a distracting tab
// CSS UI make more appealing, and you're done!

// break timer needs to be scaled so breaks don't have to be 5 minutes, numSessions counter is broken, after the break timer ends, it doesn't auto lock in again
// The distractionTabs list doesn't get disabled during a break. while(remainingSeconds > 0) disable distractionTabs List.