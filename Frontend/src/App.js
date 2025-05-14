// App.js or your main router file
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth imports
import LoginTest from './test/testlogin';
import LoginPage from './auth/login';
import ClientRegister from './auth/ClientRegister';
import CompanyRegister from './auth/CompanyRegister';
import ForgetPasswordPage from './auth/ForgetPassword';
import EnterResetCodePage from './auth/resetcode';
import CreateNewPasswordPage from './auth/createNewpassword';

// Landing page imports
import LandingPage from './Landing';
import RegistrationCategory from './Landing/RegisterCategory';

// Admin imports
import AdminSidebar from './Admin/Sidebar';
import ClientManagementA from './Admin/ClientManagement';
import CompanyManagement from './Admin/CompanyManagement';

// Client imports
import ClientSettings from './client/clientProfile';
import ClientSidebar from './client/clientSidebar';
import AllCompanies from './client/AllCompanies'; // Add this import
import CompanySidebar from './company/CompanySideBar';
import CompanySettings from './company/CompanyProfile';
import FirstLoginSetup from './auth/FirstLoginStaff';
import StaffDashboard from './Staff/StaffDashboard';
import StaffManagement from './company/staff';
import StaffSettings from './Staff/staffProfile';
import PortfolioProfileSetup from './company/PortfolioProfileSetup';
import ConstructionPortfolioProfile from './company/CompanyPortfolioProfile';
import ProjectDetails from './company/ProjectDetails';
import ClientConstructionPortfolioProfile from './client/ClientConstructionPortfolioProfile';
import ClientProjectDetails from './client/ClientProjectDetails'; // Add this import
import ProjectProposalForm from './client/ProjectProposalForm';
import ProposalManagement from './company/ProposalManagement';

import CompanyChat from './company/CompanyChat';
import StaffChat from './Staff/StaffChat';
import ChatSystem from './Chat/ChatSystem';
import ClientChat from './client/ClientChat';
import CompanyProjects from './company/CompanyProjects';
import ClientProjects from './client/ClientProjects';
import StaffProjects from './Staff/StaffProjects';
import ClientCalendar from './client/ClientCalendar';
import CompanyCalendar from './company/CompanyCalendar';
import CompanyDashboard from './company/CompanyDashboard';
import StaffNotifications from './Staff/StaffNotifications';
import ClientNotifications from './client/ClientNotifications';
import StaffProjectDetail from './Staff/StaffProjectDetail';
import StaffTasks from './Staff/StaffTasks';

import StaffCalendar from './Staff/StaffCalendar';
import StaffTaskDetail from './Staff/StaffTaskDetail';
import StaffDocuments from './Staff/StaffDocuments';
import CompanyDocuments from './company/CompanyDocuments';
// import BlueprintUploader from './Staff/QS'; // Removed this problematic import
import CompanyProjectDetail from './company/CompanyProjectDetail';
import QsTools from './Staff/QsTools';
import Dashboard from './client/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register-category" element={<RegistrationCategory />} />

        {/* Auth routes */}
        {/* <Route path="/login" element={<LoginTest />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/client-registration" element={<ClientRegister/>} />
        <Route path="/company-registration" element={<CompanyRegister />} />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        <Route path="/enter-reset-code" element={<EnterResetCodePage />} />
        <Route path="/create-new-password" element={<CreateNewPasswordPage />} />

        {/* Admin routes */}
        <Route path="/admin-dashboard" element={<AdminSidebar />} />
        <Route path="/client-management" element={<ClientManagementA/>} />
        <Route path="/company-management" element={<CompanyManagement/>} />

        {/* Client routes */}
        <Route path="/client-dashboard" element={<ClientSidebar />} />
        <Route path="/client-d" element={<Dashboard />} />
        <Route path="/client-profile" element={<ClientSettings />} />
        <Route path="/all-companies" element={<AllCompanies />} /> {/* Added AllCompanies route */}
        <Route path="/client/construction-portfolio/:companyId" element={ <ClientConstructionPortfolioProfile />} />
        <Route path="/client-project-details" element={<ClientProjectDetails />} />
        <Route path="/client-project-details/:projectId" element={<ClientProjectDetails />} />
        <Route path="/send-proposal" element={<ProjectProposalForm />} />
        <Route path="/client-projects" element={<ClientProjects />} />
        <Route path="/client-calendar" element={<ClientCalendar />} />
        <Route path="/client/notifications" element={<ClientNotifications />} />

        {/* Company routes */}
        <Route path="/company-dashboard" element={<CompanySidebar />} />
        <Route path="/company-d" element={<CompanyDashboard />} />
        <Route path="/company-profile" element={<CompanySettings />} />
        <Route path="/staff-management" element={<StaffManagement />} />
        <Route path="/first-login" element={<FirstLoginSetup />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff-settings" element={<StaffSettings />} />
        <Route path="/proposal-management" element={<ProposalManagement />} />
        <Route path="/chat" element={<ClientChat />} />
        <Route path="/company-chat" element={<CompanyChat />} />
        <Route path="/staff-chat" element={<StaffChat />} />
        <Route path="/company-projects" element={<CompanyProjects />} />
        <Route path="/company-calender" element={<CompanyCalendar />} />
        <Route path="/company-project-details/:projectId" element={<CompanyProjectDetail />} />
    

        {/* Portfolio routes */}
        <Route path="/portfolio-setup-test" element={<PortfolioProfileSetup />} />
        <Route path="/portfolio/:companyId" element={<ConstructionPortfolioProfile />} />
        <Route path="/portfolio-profile" element={<ConstructionPortfolioProfile />} /> {/* Keep for backward compatibility */}
        <Route path="/project-details" element={<ProjectDetails />} />
        <Route path="/project-details/:projectId" element={<ProjectDetails />} /> {/* Add this route */}

        <Route path="/staff-projects" element={<StaffProjects />} />
        <Route path="/staff-projects/:projectId" element={<StaffProjectDetail />} />
        <Route path="/staff-tasks" element={<StaffTasks />} />
  
        <Route path="/staff-tasks/:id" element={<StaffTaskDetail />} />
        <Route path="/staff-calendar" element={<StaffCalendar />} />
        <Route path="/staff-notifications" element={<StaffNotifications />} />
        <Route path="/staff-documents" element={<StaffDocuments />} />
        <Route path="/staff-documents/:projectId" element={<StaffDocuments />} />
        
        {/* Company document routes */}
        <Route path="/company-documents" element={<CompanyDocuments />} />
        <Route path="/company-documents/:projectId" element={<CompanyDocuments />} />


        {/* Blueprint Uploader route */}
        <Route path="/qs-tools" element={<QsTools/>} />

        {/* Chat system route */}

        
        {/* Add a catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;