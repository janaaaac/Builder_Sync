import React, { useState, useEffect } from "react";

const ChatList = ({ contacts, selectedContact, handleContactSelect, loading, userType, error }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [debugInfo, setDebugInfo] = useState({show: false, contactsCount: 0});

  useEffect(() => {
    // For debugging purposes
    setDebugInfo({
      show: process.env.NODE_ENV !== 'production',
      contactsCount: Array.isArray(contacts) ? contacts.length : 0,
      contactsValid: Array.isArray(contacts)
    });
    
    // Filter contacts based on search term
    if (!Array.isArray(contacts)) {
      console.error("Contacts is not an array:", contacts);
      setFilteredContacts([]);
      return;
    }
    
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        contact && contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  // Quick troubleshooting function
  const toggleDebugInfo = () => {
    setDebugInfo(prev => ({...prev, show: !prev.show}));
  };

  return (
    <div className="w-62 md:w-70 flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Messages
          {/* Add a small debug button in development */}
          {process.env.NODE_ENV !== 'production' && (
            <button 
              onClick={toggleDebugInfo}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600"
              title="Show debug info"
            >
              ⓘ
            </button>
          )}
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Show debug info if enabled */}
      {debugInfo.show && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs">
          <p><strong>Debug:</strong> {debugInfo.contactsCount} contacts loaded</p>
          <p><strong>Contacts valid array:</strong> {debugInfo.contactsValid ? 'Yes' : 'No'}</p>
          <p><strong>User type:</strong> {userType || 'Not set'}</p>
          {error && <p className="text-red-500"><strong>Error:</strong> {error}</p>}
        </div>
      )}

      <div className="overflow-y-auto flex-1 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center p-6 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {searchTerm ? "No contacts match your search" : "No contacts available"}
            {error ? (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            ) : (
              <p className="mt-1 text-sm">
                {searchTerm ? "Try a different search term" : `Connect with ${userType === "client" ? "companies" : userType === "company" ? "clients" : "contacts"} to start chatting`}
              </p>
            )}
            
            {/* Show a refresh button */}
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
            >
              Refresh
            </button>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isActive =
              selectedContact &&
              ((selectedContact._id && contact._id && String(selectedContact._id) === String(contact._id)) ||
               (selectedContact.id && contact.id && String(selectedContact.id) === String(contact.id)));
            return (
              <div
                key={contact._id || contact.id || `contact-${Math.random()}`}
                className={`flex items-center p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition duration-150${isActive ? " bg-orange-50" : ""}`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="relative">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/Assets/default-avatar.png";
                    }}
                  />
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    {/* Remove time for staff chat list */}
                    {userType !== "staff" && contact.time && (
                      <span className="text-xs text-gray-500">{contact.time}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                    {contact.unreadCount > 0 ? (
                      <div className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {contact.unreadCount}
                      </div>
                    ) : contact.read ? (
                      <div className="text-orange-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;