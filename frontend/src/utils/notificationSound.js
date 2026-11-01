export const isNotificationSoundEnabled = () => (
  localStorage.getItem("pagasa-notification-sound") !== "off"
);

export const setNotificationSoundEnabled = (enabled) => {
  localStorage.setItem("pagasa-notification-sound", enabled ? "on" : "off");
};

let audioContext;

export const unlockNotificationSound = async () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") await audioContext.resume();
  } catch {
    // Sound remains optional when the browser blocks audio initialization.
  }
};

export const playNotificationChime = async () => {
  if (!isNotificationSoundEnabled()) return;

  try {
    await unlockNotificationSound();
    if (!audioContext) return;
    const context = audioContext;
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.65);

    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + (index * 0.16));
      oscillator.stop(context.currentTime + 0.5 + (index * 0.16));
    });

    window.setTimeout(() => gain.disconnect(), 850);
  } catch {
    // Browsers may block sound until the user has interacted with the page.
  }
};
