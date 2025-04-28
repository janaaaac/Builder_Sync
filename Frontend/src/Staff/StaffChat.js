import React, { useState, useEffect } from "react";
import ChatSystem from "../Chat/ChatSystem";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StaffSidebar from "./staffSideBar";
import ChatList from "../Chat/ChatList";

const StaffChat = () => {
  const navigate = useNavigate();
  const [staffInfo, setStaffInfo] = useState(null);
  const [companyStaff, setCompanyStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, role, company
  const [selectedContact, setSelectedContact] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const API_URL = "http://localhost:5001";

  // Check if user is authenticated as staff
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Fetch staff profile using token
    const fetchProfileAndStaff = async () => {
      try {
        setLoading(true);
        const profileRes = await axios.get(`${API_URL}/api/staff/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const staffData = profileRes.data.data || profileRes.data;
        setStaffInfo(staffData);
        // Fetch company and coworkers (company + staff in same company except self)
        const contactsRes = await axios.get(`${API_URL}/api/chat/staff/company-contacts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setCompanyStaff(contactsRes.data);
        setFilteredStaff(contactsRes.data);
      } catch (err) {
        setError('Authentication error or failed to load staff info.');
        setTimeout(() => navigate('/login'), 1500);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndStaff();
  }, [navigate]);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };
// Filter contacts based on active tab
  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // setSidebarCollapsed(someValue);

  return (
    <div className="flex h-screen">
      <StaffSidebar onCollapseChange={setSidebarCollapsed} />
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
        <div className="flex h-full">
          <div className="w-72 bg-white border-r">
            <ChatList
              contacts={filteredStaff}
              selectedContact={selectedContact}
              handleContactSelect={handleContactSelect}
              loading={loading}
              userType="staff"
              error={error}
            />
          </div>
          <div className="flex-1 bg-white">
            {selectedContact ? (
              <ChatSystem
                selectedContact={selectedContact}
                currentUser={staffInfo}
                userRole="staff"
                sidebar={<></>}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white min-h-[700px] p-12">
                <div className="text-center w-full max-w-md mx-auto">
                  <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
    </div>
  );
};

export default StaffChat;