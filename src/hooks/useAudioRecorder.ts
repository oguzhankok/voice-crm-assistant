// ============================================================
// VoiceCRM — Audio Recording Hook
// Uses Web Audio API / MediaRecorder (analogous to expo-av)
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState } from '../types';

const INITIAL_STATE: RecordingState = {
  isRecording: false,
  recordingDuration: 0,
  audioUri: null,
  audioBlob: null,
  permissionGranted: false,
  permissionDenied: false,
};

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>(INITIAL_STATE);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setState((prev) => ({ ...prev, permissionDenied: true }));
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({
        ...prev,
        permissionGranted: true,
        permissionDenied: false,
      }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setState((prev) => ({
        ...prev,
        permissionGranted: false,
        permissionDenied: true,
      }));
      return false;
    }
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Request fresh permission / stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Determine supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const uri = URL.createObjectURL(blob);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioUri: uri,
          audioBlob: blob,
        }));

        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.onerror = () => {
        setState((prev) => ({
          ...prev,
          isRecording: false,
        }));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording with 250ms chunks
      recorder.start(250);

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setState((prev) => ({ ...prev, recordingDuration: elapsed }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        recordingDuration: 0,
        audioUri: null,
        audioBlob: null,
        permissionGranted: true,
        permissionDenied: false,
      }));

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState((prev) => ({
        ...prev,
        permissionDenied: true,
      }));
      return false;
    }
  }, []);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Reset recording state (clear audio data)
   */
  const resetRecording = useCallback(() => {
    if (state.audioUri) {
      URL.revokeObjectURL(state.audioUri);
    }
    setState((prev) => ({
      ...prev,
      audioUri: null,
      audioBlob: null,
      recordingDuration: 0,
    }));
  }, [state.audioUri]);

  /**
   * Format recording duration as MM:SS
   */
  const formattedDuration = formatDuration(state.recordingDuration);

  return {
    ...state,
    formattedDuration,
    requestPermission,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
