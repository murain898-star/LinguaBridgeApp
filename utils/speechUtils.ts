// Simple wrapper for Web Speech API

// Recognition
export const startSpeechRecognition = (
  langCode: string,
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: any) => void
): any => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    onError("Speech recognition not supported in this browser.");
    return null;
  }

  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false; // Stop after one sentence/phrase for translation flow
  recognition.interimResults = false;
  recognition.lang = langCode;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error", event.error);
    onError(event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
    return recognition;
  } catch (e) {
    console.error("Failed to start recognition", e);
    onError(e);
    return null;
  }
};

// Synthesis (TTS)
export const speakText = (text: string, langCode: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Text-to-speech not supported.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  
  // Try to find a voice that matches the language
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0])); // fuzzy match
  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};
