import { useEffect, useRef, useState } from "react";
import { api } from "../utils/api";

function floatToPcm16(input: Float32Array): ArrayBuffer {
  const pcm16 = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    pcm16[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
  }
  return pcm16.buffer;
}

async function fetchAssemblyAIToken(): Promise<string | null> {
  if (import.meta.env.DEV) {
    try {
      const res = await fetch("/api/assemblyai-token");
      if (res.ok) {
        const data = await res.json();
        return data.token;
      }
    } catch {}
  }
  const response = await api.getAssemblyAIToken();
  if (response.success && response.data) return response.data.token;
  return null;
}

export function useVoiceTranscription(
  onTranscriptChange: (text: string) => void,
) {
  const [isRecording, setIsRecording] = useState(false);
  const baseTextRef = useRef("");
  const finalizedRef = useRef<string[]>([]);
  const onChangeRef = useRef(onTranscriptChange);

  useEffect(() => {
    onChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    if (!isRecording) return;

    let ws: WebSocket | null = null;
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let cancelled = false;

    function updateText(partial: string) {
      const finalized = finalizedRef.current.join(" ");
      const separator = finalized && partial ? " " : "";
      onChangeRef.current(
        baseTextRef.current + finalized + separator + partial,
      );
    }

    async function start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStream = stream;

      audioContext = new AudioContext();
      await audioContext.resume();
      const sampleRate = audioContext.sampleRate;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      const audioBuffer: ArrayBuffer[] = [];
      let wsReady = false;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        const chunk = floatToPcm16(event.inputBuffer.getChannelData(0));
        if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(chunk);
        } else {
          audioBuffer.push(chunk);
        }
      };

      if (cancelled) return;

      const token = await fetchAssemblyAIToken();
      if (cancelled || !token) {
        if (!cancelled) setIsRecording(false);
        return;
      }

      ws = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?speech_model=u3-rt-pro&sample_rate=${sampleRate}&token=${token}`,
      );
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        for (const chunk of audioBuffer) {
          ws!.send(chunk);
        }
        audioBuffer.length = 0;
        wsReady = true;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "Turn") {
          const text = (data.transcript || "")
            .replace(/[—–]/g, "-")
            .trim();
          if (data.end_of_turn && text) {
            finalizedRef.current.push(text);
            updateText("");
          } else if (text) {
            updateText(text);
          }
        }
      };

      ws.onerror = () => {
        if (!cancelled) setIsRecording(false);
      };

      ws.onclose = () => {
        if (!cancelled) setIsRecording(false);
      };
    }

    start().catch(() => {
      if (!cancelled) setIsRecording(false);
    });

    return () => {
      cancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ terminate_session: true }));
        ws.close();
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isRecording]);

  const startRecording = (baseText: string) => {
    baseTextRef.current = baseText
      ? baseText.endsWith(" ")
        ? baseText
        : baseText + " "
      : "";
    finalizedRef.current = [];
    setIsRecording(true);
  };

  const stopRecording = () => setIsRecording(false);

  return { isRecording, startRecording, stopRecording };
}
