import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Video, VideoOff, Disc, PhoneOff, Send } from 'lucide-react';
import { NotificationDialog } from '@/components/ui/notification-dialog';
import { Button } from '@/components/ui/button';

interface VideoCallInterfaceProps {
    roomId: string;
    partnerId: string;
    onEndCall: () => void;
}

interface ChatMessage {
    id: string;
    user_id: string;
    user_name: string;
    content: string;
    timestamp: string;
}

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

// Icons
const CameraIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const CameraOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </svg>
);

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({ roomId, partnerId, onEndCall }) => {
    const { user, profile } = useAuth();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [connectionState, setConnectionState] = useState<string>('connecting');

    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info'
    });

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const recordedChunks = useRef<Blob[]>([]);
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
    const channelRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processedMessages = useRef<Set<string>>(new Set());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    useEffect(() => {
        const initCall = async () => {
            try {
                console.log('[WebRTC] Initializing call for room:', roomId);

                //Get local media stream
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Create peer connection
                const pc = new RTCPeerConnection(STUN_SERVERS);
                peerConnection.current = pc;

                // Add local tracks to peer connection
                stream.getTracks().forEach((track) => {
                    console.log('[WebRTC] Adding local track:', track.kind);
                    pc.addTrack(track, stream);
                });

                // Handle incoming remote tracks
                pc.ontrack = (event) => {
                    console.log('[WebRTC] Received remote track:', event.streams[0]);
                    setRemoteStream(event.streams[0]);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                // Monitor connection state
                pc.oniceconnectionstatechange = () => {
                    console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
                    setConnectionState(pc.iceConnectionState);
                };

                pc.onconnectionstatechange = () => {
                    console.log('[WebRTC] Connection state:', pc.connectionState);
                    if (pc.connectionState === 'failed') {
                        console.error('[WebRTC] Connection failed, attempting to restart ICE');
                        pc.restartIce();
                    }
                };

                // Handle ICE candidates
                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        console.log('[WebRTC] Sending ICE candidate via NestJS Gateway (TODO)');
                        // TODO: Send candidate via NestJS Gateway
                    }
                };

                // TODO: Implement NestJS WebSocket signaling here
                console.log('VideoCallInterface: Implement NestJS WebSocket signaling here.');

                // Mock connection for UI testing
                setConnectionState('connected');

            } catch (err) {
                console.error('[WebRTC] Error initializing call:', err);
                setNotification({
                    isOpen: true,
                    title: 'Lỗi khởi tạo cuộc gọi',
                    description: 'Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền trình duyệt.',
                    type: 'error'
                });
            }
        };

        initCall();

        return () => {
            console.log('[WebRTC] Cleaning up call');
            localStream?.getTracks().forEach(t => t.stop());
            peerConnection.current?.close();
            // Cleanup WebSocket
        };
    }, [roomId, partnerId, user?.id, profile?.id]); // FIXED: Use stable IDs instead of objects

    const toggleMute = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
            setIsMuted(!isMuted);
        }
    }, [localStream, isMuted]);

    const toggleCamera = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !isCameraOff);
            setIsCameraOff(!isCameraOff);
        }
    }, [localStream, isCameraOff]);

    const startRecording = useCallback(() => {
        if (!remoteStream && !localStream) return;

        const streamToRecord = remoteStream || localStream;
        if (!streamToRecord) return;

        const recorder = new MediaRecorder(streamToRecord);
        mediaRecorder.current = recorder;
        recordedChunks.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.current.push(e.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            // const fileName = `recording_${roomId}_${Date.now()}.webm`;

            if (user?.id) {
                // TODO: Upload recording to NestJS API
                console.log('Video recording stopped. Implement upload to NestJS API.');
                setNotification({
                    isOpen: true,
                    title: 'Đã lưu bản ghi (Demo)',
                    description: 'Video cuộc gọi đã được lưu (giả lập).',
                    type: 'success'
                });
            }
            setIsRecording(false);
        };

        recorder.start();
        setIsRecording(true);
    }, [remoteStream, localStream, roomId, user?.id]);

    const stopRecording = useCallback(() => {
        mediaRecorder.current?.stop();
    }, []);

    const sendMessage = useCallback(async () => {
        if (!user || !profile || !messageInput.trim()) return;

        const message: ChatMessage = {
            id: `${user.id}_${Date.now()}`,
            user_id: user.id,
            user_name: profile.full_name,
            content: messageInput.trim(),
            timestamp: new Date().toISOString(),
        };

        // TODO: Send chat message via NestJS WebSocket
        console.log('Sending chat message via NestJS Gateway (TODO):', message);

        // Add to local state for demo
        setChatMessages(prev => [...prev, message]);

        setMessageInput('');
    }, [user, profile, messageInput]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
            <NotificationDialog
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                description={notification.description}
                type={notification.type}
            />

            <div className="w-[min(1440px,95vw)] rounded-[64px] p-8 bg-gradient-to-br from-white to-[#ecfbff] grid grid-cols-[2fr_1fr] gap-12 shadow-xl border border-slate-100">
                {/* Left: Remote Video (2fr - Larger) */}
                <div className="flex flex-col gap-6">
                    {/* Header with Logo and Title */}
                    <div className="flex items-center gap-6 mb-2">
                        <div className="w-16 h-16 flex-shrink-0">
                            <img src="/src/assets/sidebar-avatar.png" alt="nervIS" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            Luyện tập phỏng vấn 1v1
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative rounded-[32px] overflow-hidden shadow-md border border-slate-200 aspect-video bg-slate-100">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand-cyan animate-spin" />
                                    <p className="text-slate-400 font-medium">Đang chờ đối phương...</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                            Đối phương
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                connectionState === 'connected' ? "bg-green-500" :
                                    connectionState === 'connecting' ? "bg-yellow-500 animate-pulse" :
                                        "bg-red-500"
                            )} />
                            <span className="text-slate-700">
                                {connectionState === 'connected' ? 'Đã kết nối' :
                                    connectionState === 'connecting' ? 'Đang kết nối...' :
                                        'Mất kết nối'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (1fr - Smaller, like InterviewVoice) */}
                <div className="flex flex-col gap-6">
                    {/* Local Video Preview */}
                    <div className="relative rounded-[32px] overflow-hidden shadow-md border border-slate-200 bg-white aspect-video">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn("w-full h-full object-cover mirror", isCameraOff && "opacity-0")}
                        />
                        {isCameraOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                <div className="flex flex-col items-center gap-2">
                                    <VideoOff className="w-8 h-8 text-slate-300" />
                                    <span className="text-sm text-slate-400">Camera tắt</span>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={toggleCamera}
                            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full transition-all shadow-sm"
                            title={isCameraOff ? 'Bật camera' : 'Tắt camera'}
                        >
                            {isCameraOff ? <CameraOffIcon /> : <CameraIcon />}
                        </button>
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                            {profile?.full_name || 'Bạn'}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[24px] bg-white/50 backdrop-blur-sm border border-slate-100">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleMute}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isMuted ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all",
                                    isRecording
                                        ? "bg-red-50 text-red-500 border border-red-200 animate-pulse"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-brand-cyan hover:text-brand-cyan"
                                )}
                            >
                                <Disc className="w-4 h-4" />
                                {isRecording ? "Đang ghi" : "Ghi"}
                            </button>
                        </div>
                        <button
                            onClick={onEndCall}
                            className="px-4 py-2 rounded-full bg-[#ff5a5d] hover:bg-[#ff4246] text-white text-sm font-medium shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                        >
                            <PhoneOff className="w-4 h-4" />
                            Kết thúc
                        </button>
                    </div>

                    {/* Chat Section */}
                    <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm rounded-[24px] border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-900 text-sm">Tin nhắn</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px] max-h-[300px]">
                            {chatMessages.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-8">Chưa có tin nhắn</p>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] ${msg.user_id === user?.id ? 'bg-brand-cyan text-white' : 'bg-slate-100 text-slate-800'} rounded-2xl px-3 py-2`}>
                                            {msg.user_id !== user?.id && (
                                                <p className="text-xs font-semibold mb-1 opacity-75">{msg.user_name}</p>
                                            )}
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-3 border-t border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!messageInput.trim()}
                                    size="sm"
                                    className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 px-4"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
