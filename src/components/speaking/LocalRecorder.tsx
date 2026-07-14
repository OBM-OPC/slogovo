"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";

export function LocalRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, [audioUrl]);

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Aufnahme wird von diesem Browser nicht unterstützt.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const next = URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return next;
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Mikrofonzugriff wurde nicht erlaubt oder ist nicht verfügbar.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const remove = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  return (
    <div className="rounded-xl bg-warm-50 p-3 text-left">
      <p className="text-xs text-muted">Erst der Klick auf „Aufnehmen“ fragt nach Mikrofonzugriff. Die Aufnahme bleibt nur lokal im Browser, wird nicht hochgeladen und verschwindet beim Verlassen der Seite.</p>
      <button type="button" className={`mt-3 w-full ${recording ? "btn-accent" : "btn-outline"}`} onClick={recording ? stop : () => void start()}>{recording ? <><Square className="h-4 w-4" /> Aufnahme stoppen</> : <><Mic className="h-4 w-4" /> Aufnehmen & selbst anhören</>}</button>
      {audioUrl && <div className="mt-3 flex items-center gap-2"><audio controls src={audioUrl} className="min-w-0 flex-1" aria-label="Eigene Aufnahme abspielen" /><button type="button" onClick={remove} className="rounded-xl p-2 text-accent" aria-label="Lokale Aufnahme löschen"><Trash2 className="h-5 w-5" /></button></div>}
      {error && <p role="alert" className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
