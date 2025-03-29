// App.js or your main router file
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import LoginTest from './test/testlogin';
import TestClientManagement from './test/testclientManagement';
import LandingPage from './Landing';
import ClientRegister from './auth/ClientRegister';
import ForgetPasswordPage from './auth/ForgetPassword';
import EnterResetCodePage from './auth/resetcode';
import CreateNewPasswordPage from './auth/createNewpassword';
import CompanyRegister from './auth/CompanyRegister';
import ConstructionProfile from './client/clientProfile';
import TestCompanyManagement from './test/testCompanyManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginTest />} />
        <Route path="/client-management" element={<TestClientManagement/>} />
        <Route path="/company-management" element={<ClientRegister/>} />
        <Route path="/company-register" element={<CompanyRegister />} />
        <Route path="/landing" element={<TestCompanyManagement />} />
        <Route path="/" element={<ConstructionProfile/>} />


        {/* Add a catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;