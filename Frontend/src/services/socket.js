import { io } from "socket.io-client";

// Connect to the backend Socket.IO server
const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5001", {
  withCredentials: true,
});

export default socket;