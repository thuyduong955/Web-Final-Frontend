"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, Copy, Check, ArrowLeft, Users, Loader2 } from 'lucide-react';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

interface ChatMessage {
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
}

interface RoomUser {
    socketId: string;
    userId: string;
    userName: string;
    role: 'interviewer' | 'interviewee';
}

function VideoCallContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, profile } = useAuth();

    const roomId = searchParams.get('room') || '';
    const role = (searchParams.get('role') as 'interviewer' | 'interviewee') || 'interviewee';

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUser, setRemoteUser] = useState<RoomUser | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [connectionState, setConnectionState] = useState<string>('Đang khởi tạo...');
    const [copied, setCopied] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const remoteUserRef = useRef<RoomUser | null>(null);

    const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const userId = user?.id || `guest-${Date.now()}`;

    const addLog = (msg: string) => {
        console.log(`[VideoCall] ${msg}`);
        setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    // Scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Initialize socket connection
    useEffect(() => {
        if (!roomId) {
            setConnectionState('Room ID không hợp lệ');
            return;
        }

        // Get WebSocket URL from API URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        // Remove /api suffix and use HTTP for socket.io (it will upgrade to WebSocket)
        const baseUrl = apiUrl.replace('/api', '').replace(/\/$/, '');

        addLog(`Connecting to: ${baseUrl}/video-call`);
        setConnectionState('Đang kết nối server...');

        const newSocket = io(`${baseUrl}/video-call`, {
            transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            addLog(`Connected! Socket ID: ${newSocket.id}`);
            setIsConnected(true);
            setConnectionState('Đang tham gia phòng...');

            // Join room
            newSocket.emit('join-room', {
                roomId,
                userId,
                userName,
                role,
            });
        });

        newSocket.on('connect_error', (err) => {
            addLog(`Connection error: ${err.message}`);
            setConnectionState(`Lỗi kết nối: ${err.message}`);
        });

        newSocket.on('disconnect', (reason) => {
            addLog(`Disconnected: ${reason}`);
            setIsConnected(false);
            setConnectionState('Mất kết nối server');
        });

        newSocket.on('room-users', async ({ users }: { users: RoomUser[] }) => {
            addLog(`Users in room: ${users.length}`);
            if (users.length > 0) {
                const otherUser = users[0];
                setRemoteUser(otherUser);
                remoteUserRef.current = otherUser;
                setConnectionState(`${otherUser.userName} đã trong phòng`);

                // We joined and there's already someone - create offer
                setTimeout(() => createOffer(otherUser.socketId), 1000);
            } else {
                setConnectionState('Đang chờ người khác tham gia...');
            }
        });

        newSocket.on('user-joined', async ({ userId, userName, role, socketId }: RoomUser) => {
            addLog(`User joined: ${userName}`);
            const newUser = { userId, userName, role, socketId };
            setRemoteUser(newUser);
            remoteUserRef.current = newUser;
            setConnectionState(`${userName} đã tham gia`);

            // Existing user creates offer when new user joins
            setTimeout(() => createOffer(socketId), 1000);
        });

        newSocket.on('user-left', ({ userName }: { userName: string }) => {
            addLog(`User left: ${userName}`);
            setRemoteUser(null);
            remoteUserRef.current = null;
            setConnectionState(`${userName} đã rời phòng`);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        });

        newSocket.on('offer', async ({ offer, fromSocketId }: { offer: RTCSessionDescriptionInit; fromSocketId: string }) => {
            addLog(`Received offer from: ${fromSocketId}`);
            await handleOffer(offer, fromSocketId);
        });

        newSocket.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            addLog('Received answer');
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    addLog('Remote description set successfully');
                } catch (err) {
                    addLog(`Error setting remote description: ${err}`);
                }
            }
        });

        newSocket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            if (peerConnectionRef.current && candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    addLog(`Error adding ICE candidate: ${err}`);
                }
            }
        });

        newSocket.on('chat-message', (msg: ChatMessage) => {
            setChatMessages(prev => [...prev, msg]);
        });

        setSocket(newSocket);

        return () => {
            addLog('Cleaning up socket...');
            newSocket.emit('leave-room', { roomId });
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Initialize local media
    useEffect(() => {
        const initMedia = async () => {
            try {
                addLog('Requesting camera/mic access...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                addLog('Camera/mic access granted');
            } catch (err) {
                addLog(`Media error: ${err}`);
                setConnectionState('Không thể truy cập camera/mic');
            }
        };

        initMedia();

        return () => {
            // Cleanup handled elsewhere
        };
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        addLog('Creating peer connection...');
        const pc = new RTCPeerConnection(STUN_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current && remoteUserRef.current) {
                socketRef.current.emit('ice-candidate', {
                    roomId,
                    targetSocketId: remoteUserRef.current.socketId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            addLog('Received remote track!');
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setConnectionState('Đang gọi video');
            }
        };

        pc.onconnectionstatechange = () => {
            addLog(`Connection state: ${pc.connectionState}`);
            if (pc.connectionState === 'connected') {
                setConnectionState('Đang gọi video');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setConnectionState('Mất kết nối video');
            }
        };

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
            addLog(`Added ${localStream.getTracks().length} local tracks`);
        }

        peerConnectionRef.current = pc;
        return pc;
    }, [roomId, localStream]);

    // Create offer
    const createOffer = async (targetSocketId: string) => {
        if (!socketRef.current || !localStream) {
            addLog('Cannot create offer - missing socket or stream');
            return;
        }

        addLog(`Creating offer for: ${targetSocketId}`);
        const pc = createPeerConnection();

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current.emit('offer', {
                roomId,
                targetSocketId,
                offer,
            });
            addLog('Offer sent');
        } catch (err) {
            addLog(`Error creating offer: ${err}`);
        }
    };

    // Handle incoming offer
    const handleOffer = async (offer: RTCSessionDescriptionInit, fromSocketId: string) => {
        if (!socketRef.current || !localStream) {
            addLog('Cannot handle offer - missing socket or stream');
            return;
        }

        addLog('Handling incoming offer...');
        const pc = createPeerConnection();

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit('answer', {
                roomId,
                targetSocketId: fromSocketId,
                answer,
            });
            addLog('Answer sent');
        } catch (err) {
            addLog(`Error handling offer: ${err}`);
        }
    };

    // Toggle mic
    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    // Toggle camera
    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
        }
    };

    // Send chat message
    const sendMessage = () => {
        if (!messageInput.trim() || !socket) return;

        socket.emit('chat-message', {
            roomId,
            userId,
            userName,
            message: messageInput.trim(),
        });

        setMessageInput('');
    };

    // End call
    const endCall = () => {
        if (socket) {
            socket.emit('leave-room', { roomId });
            socket.disconnect();
        }
        localStream?.getTracks().forEach(track => track.stop());
        peerConnectionRef.current?.close();
        router.push('/training1v1');
    };

    // Copy room link
    const copyRoomLink = () => {
        const otherRole = role === 'interviewer' ? 'interviewee' : 'interviewer';
        const link = `${window.location.origin}/training1v1/call?room=${roomId}&role=${otherRole}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!roomId) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] dark:bg-slate-900 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">Room ID không hợp lệ</p>
                    <Button onClick={() => router.push('/training1v1')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] dark:bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/training1v1')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Phỏng vấn 1v1
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <p className="text-sm text-slate-500 dark:text-slate-400">{connectionState}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={copyRoomLink}>
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Đã copy' : 'Copy link mời'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={endCall}>
                        <PhoneOff className="w-4 h-4 mr-2" />
                        Kết thúc
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex">
                {/* Video area */}
                <div className="flex-1 p-6">
                    <div className="h-full grid grid-cols-2 gap-4">
                        {/* Local video */}
                        <Card className="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {isCameraOff && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-brand-cyan)] flex items-center justify-center text-white text-2xl font-bold mb-2">
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400">Camera đang tắt</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 rounded-lg text-white text-sm">
                                Bạn ({role === 'interviewer' ? 'Interviewer' : 'Interviewee'})
                            </div>
                        </Card>

                        {/* Remote video */}
                        <Card className="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {!remoteUser && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center mb-4">
                                            <Users className="w-10 h-10 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">
                                            Đang chờ người khác...
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Chia sẻ link để mời
                                        </p>
                                    </div>
                                </div>
                            )}
                            {remoteUser && (
                                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 rounded-lg text-white text-sm">
                                    {remoteUser.userName} ({remoteUser.role === 'interviewer' ? 'Interviewer' : 'Interviewee'})
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Controls */}
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <Button
                            variant={isMuted ? 'destructive' : 'secondary'}
                            size="lg"
                            onClick={toggleMic}
                            className="rounded-full w-14 h-14"
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </Button>
                        <Button
                            variant={isCameraOff ? 'destructive' : 'secondary'}
                            size="lg"
                            onClick={toggleCamera}
                            className="rounded-full w-14 h-14"
                        >
                            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </Button>
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={endCall}
                            className="rounded-full w-14 h-14"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Chat sidebar */}
                <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Chat</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 && (
                            <p className="text-center text-sm text-slate-400">Chưa có tin nhắn</p>
                        )}
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`${msg.userId === userId ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${msg.userId === userId
                                    ? 'bg-[var(--color-brand-cyan)] text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                    }`}>
                                    {msg.userId !== userId && (
                                        <p className="text-xs opacity-70 mb-1">{msg.userName}</p>
                                    )}
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                        <Input
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Nhập tin nhắn..."
                            className="bg-slate-50 dark:bg-slate-700"
                        />
                        <Button size="icon" onClick={sendMessage} className="bg-[var(--color-brand-cyan)] hover:bg-[var(--color-brand-blue)]">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Debug panel - only in development */}
            {process.env.NODE_ENV === 'development' && debugLog.length > 0 && (
                <div className="fixed bottom-4 left-4 w-96 bg-black/80 text-green-400 text-xs p-3 rounded-lg max-h-40 overflow-y-auto font-mono">
                    {debugLog.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function RealVideoCallPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-cyan)]" />
                    <span className="text-slate-600 dark:text-slate-300">Đang tải...</span>
                </div>
            </div>
        }>
            <VideoCallContent />
        </Suspense>
    );
}
