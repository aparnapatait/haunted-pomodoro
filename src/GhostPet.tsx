// src/content/GhostPet.tsx
import React, { useEffect, useRef, useState } from "react";

const GhostPet: React.FC = () => {
  const [time, setTime] = useState("00:00");
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      chrome.runtime.sendMessage({ type: "get-timer" }, (res) => {
        if (res?.remainingSeconds != null) {
          const mins = String(Math.floor(res.remainingSeconds / 60)).padStart(2, "0");
          const secs = String(res.remainingSeconds % 60).padStart(2, "0");
          setTime(`${mins}:${secs}`);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - (ghostRef.current?.offsetLeft || 0),
      y: e.clientY - (ghostRef.current?.offsetTop || 0),
    };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (dragging.current && ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - offset.current.x}px`;
      ghostRef.current.style.top = `${e.clientY - offset.current.y}px`;
      ghostRef.current.style.right = "";
      ghostRef.current.style.bottom = "";
    }
  };

  const onMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      ref={ghostRef}
      onMouseDown={onMouseDown}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "white",
        padding: "10px 12px",
        borderRadius: "16px",
        border: "2px solid #ccc",
        display: "flex",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "sans-serif",
        cursor: "move",
      }}
    >
      <img src={chrome.runtime.getURL("ghost.png")} alt="👻" style={{ width: 32, marginRight: 8 }} />
      <span style={{ fontWeight: "bold", fontSize: "16px" }}>{time}</span>
      <button
        onClick={() => ghostRef.current?.remove()}
        style={{
          marginLeft: 8,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        ❌
      </button>
    </div>
  );
};

export default GhostPet;
