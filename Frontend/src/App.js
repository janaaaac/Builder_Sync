// App.js or your main router file
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

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
// Fix: Correct the import or create a placeholder component
// Option 1: Fix the import path if the file exists elsewhere
// import ClientSidebar from './client/Sidebar'; 

// Option 2: Create a temporary placeholder component
const ClientDashboard = () => <div>Client Dashboard - Under Construction</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register-category" element={<RegistrationCategory />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginTest />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
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
        <Route path="/client-profile" element={<ClientSettings />} />

        {/* Add a catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;