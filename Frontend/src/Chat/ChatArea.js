import React, { useState, useEffect, useRef } from "react";
import socket from "../services/socket";
import axios from "axios";

const ChatArea = ({ room, contact, userType, userId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Emoji list for the simple emoji picker
  const emojis = ["😊", "👍", "❤️", "🙌", "👏", "🎉", "🔥", "😂", "🤔", "👋"];

  useEffect(() => {
    // Join the chat room
    socket.emit("joinRoom", room);

    // Fetch chat history
    socket.emit("fetchMessages", room, (fetchedMessages) => {
      setMessages(fetchedMessages);
      scrollToBottom();
    });

    // Listen for incoming messages
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
      
      // Mark message as read if it's from the other user
      if (data.sender !== userId) {
        socket.emit("messageRead", { room, messageId: data.id, user: userId });
      }
    });

    // Listen for typing indicators
    socket.on("userTyping", (data) => {
      setTypingUser(data.user);
      // Clear typing indicator after 3 seconds
      setTimeout(() => setTypingUser(null), 3000);
    });

    // Listen for file sharing events
    socket.on("fileShared", (data) => {
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("fileShared");
      socket.off("messageRead");
    };
  }, [room, userId]);

  useEffect(() => {
    messages.forEach((msg) => {
      if (
        msg.sender !== userId &&
        (!msg.readBy || !msg.readBy.includes(userId)) &&
        msg._id // or msg.id, depending on your backend
      ) {
        socket.emit("messageRead", {
          room,
          messageId: msg._id || msg.id,
          user: userId,
        });
      }
    });
  }, [messages, userId, room]);

  useEffect(() => {
    // Listen for read receipt updates from the server
    socket.on("messageReadUpdate", ({ messageId, user }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if ((msg._id || msg.id) === messageId) {
            // Add user to readBy if not already present
            if (!msg.readBy) msg.readBy = [];
            if (!msg.readBy.includes(user)) {
              return { ...msg, readBy: [...msg.readBy, user] };
            }
          }
          return msg;
        })
      );
    });
    return () => {
      socket.off("messageReadUpdate");
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleTyping = () => {
    socket.emit("typing", { room, user: userId });
  };

  const sendMessage = async () => {
    if (selectedFile) {
      await handleFileSend();
    } else if (message.trim()) {
      const data = { 
        room, 
        message, 
        sender: userId,
        timestamp: new Date(),
      };
      socket.emit("sendMessage", data);
      setMessage("");
    }
  };

  // Use explicit API URL
  const API_URL = "http://localhost:5001";

  const handleFileSend = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      // Request a presigned URL from the backend
      const response = await axios.post(`${API_URL}/api/utils/getPresignedUrl`, {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      const { presignedUrl } = response.data;

      if (presignedUrl) {
        // Upload the file to S3 using the presigned URL
        await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": selectedFile.type,
          },
          body: selectedFile,
        });

        // Extract the file URL
        const fileUrl = presignedUrl.split("?")[0];
        
        // Notify the backend about the uploaded file
        socket.emit("fileUploaded", { 
          room, 
          sender: userId, 
          fileUrl 
        });
        
        // Reset the file input
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert("File is too large. Maximum file size is 500MB.");
        return;
      }
      setSelectedFile(file);
      // Generate preview for images, or set preview for docs
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFilePreview({ type: 'image', url, name: file.name });
      } else {
        setFilePreview({ type: 'doc', url: URL.createObjectURL(file), name: file.name });
      }
    }
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.url) {
        URL.revokeObjectURL(filePreview.url);
      }
    };
  }, [filePreview]);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  const getFileIcon = (fileUrl) => {
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    
    // Return appropriate icon based on file type
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return "🖼️";
    } else if (['pdf'].includes(fileExtension)) {
      return "📄";
    } else if (['doc', 'docx'].includes(fileExtension)) {
      return "📝";
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
      return "📊";
    } else if (['zip', 'rar', '7z'].includes(fileExtension)) {
      return "🗄️";
    }
    return "📎";
  };
  
  const getFileType = (fileUrl) => {
    if (!fileUrl) return "";
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return "image";
    }
    return "file";
  };
  
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter messages if search term is provided
  const filteredMessages = searchTerm.trim() === "" 
    ? messages 
    : messages.filter(msg => 
        (msg.message && msg.message.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  return (
    <div className="flex flex-col h-full flex-1 bg-gray-50">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <img
            src={contact?.avatar}
            alt={contact?.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/Assets/default-avatar.png";
            }}
          />
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{contact?.name}</h3>
            {contact?.online ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500">Offline</span>
            )}
          </div>
        </div>
        
        {/* Search in conversation */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search in conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56 pl-8 pr-4 py-1 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <div className="absolute left-2 top-1.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {searchTerm ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 16l6-6M8 10l6 6" />
                </svg>
                <p>No results found for "{searchTerm}"</p>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Start a conversation with {contact?.name}</p>
                <p className="text-sm mt-1">Send a message to connect</p>
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.sender === userId;
            const messageTypeClass = isMe ? "ml-auto bg-orange-100" : "mr-auto bg-white";
            const alignmentClass = isMe ? "justify-end" : "justify-start";
            const fileType = msg.fileUrl ? getFileType(msg.fileUrl) : null;
            
            return (
              <div key={index} className={`flex ${alignmentClass} mb-4`}>
                {!isMe && (
                  <img
                    src={contact?.avatar}
                    alt={contact?.name}
                    className="w-8 h-8 rounded-full mr-2 self-end"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/Assets/default-avatar.png";
                    }}
                  />
                )}
                <div className={`max-w-xs md:max-w-md rounded-lg p-3 shadow-sm ${messageTypeClass}`}>
                  {msg.fileUrl ? (
                    fileType === "image" ? (
                      <div className="message-image">
                        <img 
                          src={msg.fileUrl} 
                          alt="Shared file" 
                          className="max-w-full rounded mb-1 cursor-pointer" 
                          onClick={() => window.open(msg.fileUrl, "_blank")}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Shared image</span>
                          <span className="text-xs text-gray-500">{formatMessageTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="file-message">
                        <div className="flex items-center mb-1">
                          <span className="text-xl mr-2">{getFileIcon(msg.fileUrl)}</span>
                          <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline truncate"
                          >
                            {msg.fileUrl.split('/').pop().split('?')[0]}
                          </a>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Shared file</span>
                          <span className="text-xs text-gray-500">{formatMessageTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex justify-end items-center mt-1">
                        <span className="text-xs text-gray-500">{formatMessageTime(msg.timestamp)}</span>
                        {isMe && (
                          <span className="flex items-center gap-1 ml-1">
                            {/* Delivered: single gray checkmark if not read by anyone */}
                            {(!msg.readBy || msg.readBy.length === 0) && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                            {/* Read: double orange checkmark if read by at least one user */}
                            {msg.readBy && msg.readBy.length > 0 && (
                              <span className="flex items-center gap-1 ml-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA540C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  {/* <path d="M20 6L9 17l-5-5" /> */}
                                </svg>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA540C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  {/* <path d="M23 6l-7 7-3-3" /> */}
                                </svg>
                                <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="rgb(0,0,0)" fill-rule="evenodd"><path d="m22.5303 6.46967c.2929.29289.2929.76777 0 1.06066l-10 9.99997c-.2929.2929-.7677.2929-1.0606 0l-.625-.625c-.2929-.2929-.2929-.7677 0-1.0606s.7677-.2929 1.0606 0l.0947.0946 9.4697-9.46963c.2929-.29289.7677-.29289 1.0606 0zm-16.06063 5.00003c.29289-.2929.76777-.2929 1.06066 0l.625.625c.29289.2929.29289.7677 0 1.0606s-.76777.2929-1.06066 0l-.625-.625c-.29289-.2929-.29289-.7677 0-1.0606z"/><path d="m17.5303 6.46967c.2929.29289.2929.76777 0 1.06066l-9.99997 9.99997c-.29289.2929-.76777.2929-1.06066 0l-5-5c-.29289-.2929-.29289-.7677 0-1.0606s.76777-.2929 1.06066 0l4.46967 4.4696 9.4697-9.46963c.2929-.29289.7677-.29289 1.0606 0z"/></g></svg>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        
        {/* Typing indicator */}
        {typingUser && (
          <div className="flex items-center mb-2 text-gray-500 text-sm">
            <div className="flex space-x-1 mr-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }}></div>
            </div>
            {contact?.name} is typing...
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {selectedFile && filePreview && (
          <div className="mb-2 p-2 bg-gray-100 rounded-md flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              {filePreview.type === 'image' ? (
                <img src={filePreview.url} alt={filePreview.name} className="h-16 w-auto rounded mr-2" />
              ) : (
                <span className="text-xl mr-2">{getFileIcon(selectedFile.name)}</span>
              )}
              <span className="truncate">{selectedFile.name}</span>
              {filePreview.type === 'doc' && (
                <a href={filePreview.url} download={filePreview.name} className="ml-2 text-blue-600 underline text-xs">Download</a>
              )}
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex items-end">
          <div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isUploading}
              className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none overflow-hidden"
              rows="1"
              style={{ maxHeight: "120px", minHeight: "44px" }}
            ></textarea>
            
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button 
                type="button" 
                className="text-gray-500 hover:text-orange-500"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button 
                type="button" 
                className="text-gray-500 hover:text-orange-500"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-wrap z-10">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    className="text-2xl p-1 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => addEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            className="ml-2 p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
            onClick={sendMessage}
            disabled={isUploading || (!message.trim() && !selectedFile)}
          >
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;