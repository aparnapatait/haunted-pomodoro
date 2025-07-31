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

// import { useEffect, useState } from 'react';
// import { createRoot } from "react-dom/client";

// const Popup = () => {
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [isRunning, setIsRunning] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);

//   const formatTime = (seconds: number | null) => {
//     if (seconds === null) return '00:00';
//     const min = Math.floor(seconds / 60).toString().padStart(2, '0');
//     const sec = (seconds % 60).toString().padStart(2, '0');
//     return `${min}:${sec}`;
//   };

//   const fetchTime = () => {
//     chrome.runtime.sendMessage({ command: 'getTimeRemaining' }, (response) => {
//       if (typeof response === 'number') {
//         setTimeLeft(response);
//         if (response > 0) {
//           setIsRunning(true);
//         } else {
//           setIsRunning(false);
//           setIsPaused(false);
//         }
//       } else {
//         setTimeLeft(null);
//         setIsRunning(false);
//         setIsPaused(false);
//       }
//     });
//   };

//   useEffect(() => {
//     fetchTime(); // on load

//     const interval = setInterval(() => {
//       fetchTime();
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   const sendCommand = (command: string, extra?: object) => {
//     chrome.runtime.sendMessage({ command, ...extra }, () => {
//       fetchTime();
//       if (command === 'pause') {
//         setIsPaused(true);
//         setIsRunning(false);
//       } else if (command === 'resume') {
//         setIsPaused(false);
//         setIsRunning(true);
//       } else if (command === 'stop' || command === 'reset') {
//         setIsPaused(false);
//         setIsRunning(false);
//         setTimeLeft(null);
//       } else if (command === 'start') {
//         setIsRunning(true);
//         setIsPaused(false);
//       }
//     });
//   };

//   return (
//     <div style={{ padding: '1rem', width: '200px', fontFamily: 'sans-serif' }}>
//       <h2>Pomodoro Timer</h2>
//       <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
//         {formatTime(timeLeft)}
//       </div>

//       {!isRunning && !isPaused && (
//         <button onClick={() => sendCommand('start', { duration: 25 })}>
//           Start 25-min
//         </button>
//       )}

//       {isRunning && (
//         <button onClick={() => sendCommand('pause')}>
//           Pause
//         </button>
//       )}

//       {isPaused && (
//         <button onClick={() => sendCommand('resume')}>
//           Resume
//         </button>
//       )}

//       <button onClick={() => sendCommand('reset')} style={{ marginLeft: '0.5rem' }}>
//         Reset
//       </button>

//       <div style={{ marginTop: '1rem' }}>
//         <button onClick={() => sendCommand('stop')}>
//           Stop
//         </button>
//       </div>
//     </div>
//   );
// };

// // ReactDOM.render(<Popup />, document.getElementById('root'));
// const container = document.getElementById("root");
// if (container) {
//   const root = createRoot(container);
//   root.render(<Popup />);
// }