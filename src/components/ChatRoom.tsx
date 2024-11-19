import React, { useEffect, useRef, useState } from 'react';
import { ref, onValue, push, serverTimestamp as rtdbServerTimestamp, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { rtdb, storage } from '../firebase';
import { Send, LogOut, Image as ImageIcon, Smile } from 'lucide-react';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  username: string;
  timestamp: number;
}

interface ChatRoomProps {
  username: string;
  onLogout: () => void;
}

export default function ChatRoom({ username, onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsLoading(true);
    const messagesRef = ref(rtdb, 'messages');
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const messageArray = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            ...value
          }));
          setMessages(messageArray.sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error processing messages:', error);
        setError('Failed to process messages. Please try again later.');
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    }, (error) => {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again later.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const validateImage = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Please upload only images (JPEG, PNG, GIF, or WEBP)');
      return false;
    }

    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !validateImage(file)) return;
    
    try {
      setUploadingImage(true);
      setError(null);

      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const imagePath = `chat-images/${fileName}`;
      
      // Upload to Firebase Storage
      const imageRef = storageRef(storage, imagePath);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      
      // Add message to Realtime Database
      const newMessageRef = push(ref(rtdb, 'messages'));
      await set(newMessageRef, {
        imageUrl,
        username,
        timestamp: rtdbServerTimestamp(),
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setError(null);
      const newMessageRef = push(ref(rtdb, 'messages'));
      await set(newMessageRef, {
        text: newMessage.trim(),
        username,
        timestamp: rtdbServerTimestamp(),
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-indigo-600 p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Group Chat</h1>
          <div className="flex items-center gap-3">
            <span className="text-indigo-100">Welcome, {username}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.username === username ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] break-words rounded-lg p-3 ${
                    message.username === username
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">
                      {message.username === username ? 'You' : message.username}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  {message.text && <p className="mt-1">{message.text}</p>}
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Shared image" 
                      className="mt-2 rounded-lg max-w-full max-h-[300px] object-contain cursor-pointer"
                      loading="lazy"
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="relative">
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border-2 border-gray-300 p-2 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Smile size={24} className="text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Upload image (max 5MB)"
          >
            <ImageIcon size={24} className="text-gray-600" />
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim() || uploadingImage}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}