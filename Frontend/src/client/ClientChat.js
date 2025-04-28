import React, { useEffect, useState } from "react";
import ChatSystem from "../Chat/ChatSystem";
import { useNavigate } from "react-router-dom";
import ClientSidebar from "./clientSidebar";
import axios from "axios";

const ClientChat = () => {
  const navigate = useNavigate();
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const API_URL = "http://localhost:5001";

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchProfileAndContacts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/clients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setClientInfo(res.data.data || res.data);
        // Fetch contacts (companies and staff)
        const contactsRes = await axios.get(`${API_URL}/api/chat/client/contacts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setContacts(contactsRes.data);
      } catch (err) {
        setError('Authentication error or failed to load client info.');
        setTimeout(() => navigate('/login'), 1500);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndContacts();
  }, [navigate]);

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="flex h-screen">
      <ClientSidebar onCollapseChange={handleSidebarCollapse} />
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
        <ChatSystem 
          currentUser={clientInfo} 
          userRole="client" 
          contacts={contacts} 
        />
      </div>
    </div>
  );
};

export default ClientChat;
