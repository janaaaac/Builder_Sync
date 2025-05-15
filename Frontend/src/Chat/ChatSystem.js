import React, { useState, useEffect } from "react";
import ChatList from "./ChatList";
import ChatArea from "./ChatArea";
// import ClientSidebar from "./clientSidebar";
// import CompanySideBar from "../company/CompanySideBar";
import axios from "axios";

const ChatSystem = ({ currentUser, userRole, contacts: propContacts, sidebar, selectedContact: propSelectedContact }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  
  // Use explicit API URL
  const API_URL = "http://localhost:5001";

  useEffect(() => {
    // Get user info from local storage with better error handling
    try {
      console.log("=== CHAT SYSTEM INIT ===");
      
      // Check what's actually in localStorage
      console.log("userInfo raw:", localStorage.getItem("userInfo"));
      console.log("user raw:", localStorage.getItem("user"));
      
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || localStorage.getItem("user") || "{}");
      console.log("Parsed user info:", userInfo);
      
      if (userInfo && (userInfo._id || userInfo.id)) {
        const id = userInfo._id || userInfo.id;
        console.log("Using user ID:", id);
        setUserId(id);
        
        // Set user type based on the stored role
        if (userInfo.role === "client") {
          console.log("User is a client");
          setUserType("client");
          fetchClientContacts(id);
        } else if (userInfo.role === "company") {
          console.log("User is a company");
          setUserType("company");
          fetchCompanyContacts(id); // Fetch staff and clients for company chat list
        } else if (userInfo.role === "staff" || [
          "project_manager",
          "architect",
          "engineer",
          "qs",
          "site_supervisor"
        ].includes(userInfo.role)) {
          console.log("User is a staff member");
          setUserType("staff");
          fetchStaffContacts(id);
        } else {
          console.warn("Unknown user role:", userInfo.role);
          setError(`Unknown user role: ${userInfo.role || "not set"}`);
          loadMockContacts();
        }
      } else {
        console.warn("No valid user ID found in localStorage");
        setError("User not authenticated or missing ID. Please log in again.");
        setLoading(false);
        // For testing purposes, load mock data
        loadMockContacts();
      }
    } catch (err) {
      console.error("Error parsing user info from localStorage:", err);
      setError("Error retrieving user information. Please log in again.");
      setLoading(false);
      loadMockContacts();
    }
  }, []);

  // Use new API endpoints for fetching contacts
  const fetchClientContacts = async (clientId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      // Try new endpoint first, fallback to legacy if needed
      let response;
      try {
        response = await axios.get(`${API_URL}/api/chat/client/contacts`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        // fallback to legacy direct route
        response = await axios.get(`${API_URL}/api/chat/client/${clientId}/contacts`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
      }
      if (Array.isArray(response.data)) {
        setContacts(response.data.map(formatContact));
      } else {
        setContacts([]);
        setError("Invalid contacts data received");
        loadMockContacts();
      }
    } catch (error) {
      setError("Failed to load contacts. " + (error.response?.data?.message || error.message));
      loadMockContacts();
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyContacts = async (companyId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      let response;
      try {
        // Try new API endpoint for company contacts by companyId
        response = await axios.get(`${API_URL}/api/chat/${companyId}/contacts`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        // fallback to old endpoint if needed
        response = await axios.get(`${API_URL}/api/companies/${companyId}/contacts`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
      }
      if (Array.isArray(response.data)) {
        setContacts(response.data.map(formatContact));
      } else {
        setContacts([]);
        setError("Invalid contacts data received");
        loadMockContacts();
      }
    } catch (error) {
      setError("Failed to load contacts. " + (error.response?.data?.message || error.message));
      loadMockContacts();
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffContacts = async (staffId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Use the company-specific endpoint
      const response = await axios.get(`${API_URL}/api/chat/staff/company-contacts`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (Array.isArray(response.data)) {
        setContacts(response.data.map(formatContact));
      } else {
        setContacts([]);
        setError("Invalid contacts data received");
        loadMockContacts();
      }
    } catch (error) {
      setError("Failed to load contacts. " + (error.response?.data?.message || error.message));
      loadMockContacts();
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCompanyStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chat/my-company-staff`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (Array.isArray(response.data)) {
        setContacts(response.data.map(formatContact));
      } else {
        setContacts([]);
        setError("Invalid staff data received");
      }
    } catch (error) {
      setError("Failed to load staff. " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Load mock contacts if API fails
  const loadMockContacts = () => {
    const mockContacts = [
      {
        id: "mock1",
        _id: "mock1", 
        name: "John Client",
        avatar: "/Assets/default-avatar.png",
        lastMessage: "When can we schedule a meeting?",
        time: "1:30 PM",
        online: true,
        read: false,
        type: "client",
        room: "mock_room_client_1"
      },
      {
        id: "mock2",
        _id: "mock2",
        name: "ABC Construction",
        avatar: "/Assets/default-avatar.png",
        lastMessage: "Hello, I'm interested in your services",
        time: "10:30 AM",
        online: true,
        read: false,
        type: "company",
        room: "mock_room_company_1"
      },
      {
        id: "mock3",
        _id: "mock3",
        name: "Sarah Engineer",
        avatar: "/Assets/default-avatar.png",
        lastMessage: "Project plans are ready",
        time: "Yesterday",
        online: false,
        read: true,
        type: "staff",
        room: "mock_room_staff_1"
      }
    ];
    setContacts(mockContacts);
  };

  // Helper function to format contact data
  const formatContact = (contact) => {
    if (userType === "company") {
      // Do not show the company itself in the chat list
      if (contact.type === "company" && (contact._id === userId || contact.id === userId)) {
        return null;
      }
      // Always show staff provided by backend, unless their id matches the company id (should never happen)
      if (contact.type === "staff") {
        if (contact._id === userId || contact.id === userId) {
          return null;
        }
        // No other checks needed; backend should only provide staff for this company
      }
      // Only include clients if they have sent a proposal (assume backend already filters this)
      if (contact.type === "client" && !contact.hasProposal) {
        return null;
      }
    }
    return {
      id: contact._id || contact.id,
      _id: contact._id || contact.id, // Keep both id and _id to ensure compatibility
      // Robust name logic for all contact types
      name:
         contact.name ||
        contact.fullName ||
        contact.companyName ||
        contact.contactPersonName ||
        (contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : null) ||
        contact.firstName ||
        contact.lastName ||
        contact.username ||
        contact.email ||
        "Unknown",
      avatar: contact.avatar || contact.profilePicture || contact.companyLogo || "/Assets/default-avatar.png",
      lastMessage: contact.lastMessage || "Start a conversation",
      time: contact.time ? new Date(contact.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
      online: contact.online || false,
      read: contact.read || false,
      type: contact.type || (contact.clientType ? "client" : contact.companyName ? "company" : "staff"),
      room: generateChatRoom(contact._id || contact.id, contact.type)
    };
  };

  const generateChatRoom = (contactId, contactType) => {
  if (!userType || !userId || !contactType || !contactId) return "invalid_room";
  let pair = [
    { role: userType, id: userId },
    { role: contactType, id: contactId }
  ];
  pair.sort((a, b) => a.role.localeCompare(b.role) || String(a.id).localeCompare(String(b.id)));
  return `chat_${pair[0].role}_${pair[0].id}_${pair[1].role}_${pair[1].id}`;
};

  // // Generate a unique chat room ID based on allowed chat logic
  // const generateChatRoom = (contactId, contactType) => {
  //   // Ensure userType and userId are set
  //   if (!userType || !userId || !contactType || !contactId) return "invalid_room";
  
  //   // For company-client, company-staff, client-staff, always sort by role for deterministic room
  //   // Example: chat_company_123_client_456, chat_client_456_company_123, etc.
  //   const roles = [userType, contactType];
  //   const ids = [userId, contactId];
  
  //   // Sort roles and ids together to ensure room is the same regardless of sender/receiver
  //   let pair = [
  //     { role: userType, id: userId },
  //     { role: contactType, id: contactId }
  //   ];
  //   pair.sort((a, b) => a.role.localeCompare(b.role) || String(a.id).localeCompare(String(b.id)));
  
  //   // Room format: chat_{role1}_{id1}_{role2}_{id2}
  //   return `chat_${pair[0].role}_${pair[0].id}_${pair[1].role}_${pair[1].id}`;
  // };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  // If a selectedContact is passed as a prop, use it instead of local state
  const contactToShow = typeof propSelectedContact !== 'undefined' ? propSelectedContact : selectedContact;

  // Determine which sidebar to show based on user type
  const renderSidebar = () => {
    if (userType === "client") {
      // return <ClientSidebar />;
    } else if (userType === "company") {
      // return <CompanySideBar />;
    } else if (userType === "staff") {
      // Import StaffSidebar if you have one
      // This is a placeholder - make sure to create or import a proper StaffSidebar component
      return <div className="bg-gray-800 text-white w-64 flex-shrink-0 h-full">Staff Sidebar</div>;
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebar && sidebar.type !== React.Fragment && (
        <div className="flex-shrink-0">{sidebar}</div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* Only render ChatList if not staff or if no sidebar is provided */}
        {userType !== "staff" || !sidebar ? (
          <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
            <ChatList 
              contacts={contacts} 
              selectedContact={contactToShow} 
              handleContactSelect={handleContactSelect}
              loading={loading}
              userType={userType}
              error={error}
            />
          </div>
        ) : null}
        {/* Chat Area */}
        <div className="flex-1">
          {contactToShow ? (
            <ChatArea 
              room={contactToShow.room} 
              contact={contactToShow}
              userType={userType}
              userId={userId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white min-h-[700px] p-12">
              <div className="text-center w-full max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03 8 9 8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Select a contact to start messaging</h3>
                <p className="text-gray-500 text-base">Choose from your contacts on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;