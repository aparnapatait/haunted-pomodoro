export const startTimer = (duration: number) => {
  chrome.runtime.sendMessage({ command: "start", duration });
};

export const stopTimer = () => {
  chrome.runtime.sendMessage({ command: "stop" });
};

export const pauseTimer = () => {
  chrome.runtime.sendMessage({ command: "pause" });
};

export const resumeTimer = () => {
  chrome.runtime.sendMessage({ command: "resume" });
};

export const resetTimer = () => {
  chrome.runtime.sendMessage({ command: "reset" });
};

export const getTimeRemaining = async (): Promise<number | null> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ command: "getTimeRemaining" }, (response) => {
      if (typeof response === "number") {
        resolve(response);
      } else {
        resolve(null);
      }
    });
  });
};