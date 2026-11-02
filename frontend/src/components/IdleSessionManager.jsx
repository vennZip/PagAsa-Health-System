import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"];

function IdleSessionManager() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return undefined;

    let timer;
    const endIdleSession = async () => {
      sessionStorage.setItem(
        "pagasa_logout_notice",
        "You were logged out after 30 minutes of inactivity to protect your account."
      );
      await logout();
      navigate("/login", { replace: true });
    };
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(endIdleSession, IDLE_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });
    resetTimer();

    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [currentUser, logout, navigate]);

  return null;
}

export default IdleSessionManager;
