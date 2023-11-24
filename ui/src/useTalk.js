import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js'

console.log(import.meta.env);
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const useTalk = () => {
    const [recording, setRecording] = useState(false);
    const [status, setStatus] = useState('default'); // idle, thinking, talking, listening
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const threadIDRef = useRef(null);

    useEffect(() => {
        const checkMicrophonePermissions = async () => {
            try {
                if (!navigator.permissions) {
                    console.warn('Permissions API is not supported by this browser.');
                    return;
                }

                const permission = await navigator.permissions.query({ name: 'microphone' });
                setPermissionStatus(permission.state);

                permission.onchange = () => {
                    setPermissionStatus(permission.state);
                };
            } catch (error) {
                console.error('Error checking microphone permissions:', error);
            }
        };

        checkMicrophonePermissions();
    }, []);

    const invokeSupabaseFunction = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.mp3');

        if(threadIDRef.current) {
            formData.append('threadId', threadIDRef.current);
        }

        try {
            setStatus('thinking');
            const { data, error } = await supabase.functions.invoke('talk', {
                body: formData,
            });

            if (error) return alert('Error talking to Marie:', error.message);
            
            threadIDRef.current = data.get('threadId');
            const audio = data.get('audio');
            const audioUrl = URL.createObjectURL(audio);
            const audioElement = new Audio(audioUrl);
            setStatus('talking');

            audioElement.addEventListener('ended', () => {
                setStatus('default');
            });

            audioElement.play();
        } catch (err) {
            console.error('error:', err);
        }
    };

    const startRecording = async () => {
        try {
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.start();
            setRecording(true);
            setStatus('listening');
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    useEffect(() => {
        (async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
                await invokeSupabaseFunction(audioBlob);
            };
        })();
    }, []);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return { status, recording, startRecording, stopRecording, permissionStatus };
};

export default useTalk;