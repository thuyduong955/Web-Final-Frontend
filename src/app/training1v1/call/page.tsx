"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, Copy, Check } from 'lucide-react';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
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
    const [connectionState, setConnectionState] = useState<string>('Đang kết nối...');
    const [copied, setCopied] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
    const userId = user?.id || crypto.randomUUID();

    // Scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    // Initialize socket connection
    useEffect(() => {
        if (!roomId) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const wsUrl = apiUrl.replace('/api', '').replace('http', 'ws').replace('https', 'wss');

        console.log('🔌 Connecting to WebSocket:', wsUrl);

        const newSocket = io(`${wsUrl}/video-call`, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);
            setConnectionState('Đã kết nối, đang chờ người khác...');

            // Join room
            newSocket.emit('join-room', {
                roomId,
                userId,
                userName,
                role,
            });
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
            setConnectionState('Mất kết nối');
        });

        newSocket.on('room-users', async ({ users }: { users: RoomUser[] }) => {
            console.log('👥 Users in room:', users);
            if (users.length > 0) {
                const otherUser = users[0];
                setRemoteUser(otherUser);
                setConnectionState(`${otherUser.userName} đã trong phòng`);

                // If we joined and there's already someone, we initiate the call
                await createOffer(otherUser.socketId);
            }
        });

        newSocket.on('user-joined', async ({ userId, userName, role, socketId }: RoomUser) => {
            console.log('👤 User joined:', userName);
            setRemoteUser({ userId, userName, role, socketId });
            setConnectionState(`${userName} đã tham gia`);

            // The existing user creates offer when new user joins
            await createOffer(socketId);
        });

        newSocket.on('user-left', ({ userName }: { userName: string }) => {
            console.log('👋 User left:', userName);
            setRemoteUser(null);
            setConnectionState('Người kia đã rời phòng');
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        });

        newSocket.on('offer', async ({ offer, fromSocketId }: { offer: RTCSessionDescriptionInit; fromSocketId: string }) => {
            console.log('📥 Received offer from:', fromSocketId);
            await handleOffer(offer, fromSocketId);
        });

        newSocket.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            console.log('📥 Received answer');
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        newSocket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            console.log('🧊 Received ICE candidate');
            if (peerConnection.current && candidate) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        });

        newSocket.on('chat-message', (msg: ChatMessage) => {
            setChatMessages(prev => [...prev, msg]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave-room', { roomId });
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Initialize local media
    useEffect(() => {
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error getting media:', err);
                setConnectionState('Không thể truy cập camera/mic');
            }
        };

        initMedia();

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            localStream?.getTracks().forEach(track => track.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        const pc = new RTCPeerConnection(STUN_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && remoteUser) {
                socket.emit('ice-candidate', {
                    roomId,
                    targetSocketId: remoteUser.socketId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('📹 Received remote track');
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setConnectionState('Đang gọi video');
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('🔗 Connection state:', pc.connectionState);
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
        }

        peerConnection.current = pc;
        return pc;
    }, [socket, roomId, remoteUser, localStream]);

    // Create offer
    const createOffer = async (targetSocketId: string) => {
        if (!socket || !localStream) return;

        const pc = createPeerConnection();

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('offer', {
                roomId,
                targetSocketId,
                offer,
            });
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    };

    // Handle incoming offer
    const handleOffer = async (offer: RTCSessionDescriptionInit, fromSocketId: string) => {
        if (!socket || !localStream) return;

        const pc = createPeerConnection();

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer', {
                roomId,
                targetSocketId: fromSocketId,
                answer,
            });
        } catch (err) {
            console.error('Error handling offer:', err);
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
        peerConnection.current?.close();
        router.push('/training1v1');
    };

    // Copy room link
    const copyRoomLink = () => {
        const link = `${window.location.origin}/training1v1/call?room=${roomId}&role=interviewee`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!roomId) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Room ID không hợp lệ</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-white font-semibold">Phỏng vấn 1v1</h1>
                        <p className="text-slate-400 text-sm">{connectionState}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyRoomLink} className="text-white border-slate-600">
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Đã copy' : 'Copy link'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={endCall}>
                        <PhoneOff className="w-4 h-4 mr-2" />
                        Kết thúc
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex">
                {/* Video grid */}
                <div className="flex-1 p-6 grid grid-cols-2 gap-4">
                    {/* Local video */}
                    <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {isCameraOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-600 flex items-center justify-center text-white text-2xl font-bold mb-2">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-slate-400">Camera đang tắt</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg text-white text-sm">
                            Bạn ({role === 'interviewer' ? 'Interviewer' : 'Interviewee'})
                        </div>
                    </div>

                    {/* Remote video */}
                    <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {!remoteUser && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-600 flex items-center justify-center text-slate-400 text-2xl mb-4">
                                        ?
                                    </div>
                                    <p className="text-slate-400 mb-4">Đang chờ người khác tham gia...</p>
                                    <p className="text-slate-500 text-sm">Chia sẻ link phòng để mời người khác</p>
                                </div>
                            </div>
                        )}
                        {remoteUser && (
                            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg text-white text-sm">
                                {remoteUser.userName} ({remoteUser.role === 'interviewer' ? 'Interviewer' : 'Interviewee'})
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat sidebar */}
                <div className="w-80 bg-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="text-white font-semibold">Chat</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`${msg.userId === userId ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${msg.userId === userId ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-white'}`}>
                                    {msg.userId !== userId && (
                                        <p className="text-xs text-slate-300 mb-1">{msg.userName}</p>
                                    )}
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-slate-700 flex gap-2">
                        <Input
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Nhập tin nhắn..."
                            className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button size="icon" onClick={sendMessage} className="bg-cyan-500 hover:bg-cyan-600">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-center gap-4">
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
    );
}

export default function RealVideoCallPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Đang tải...</div>
            </div>
        }>
            <VideoCallContent />
        </Suspense>
    );
}
