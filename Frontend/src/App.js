import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientRegister from './auth/ClientRegister';
import LandingPage from './Landing';
import CompanyRegister from './auth/CompanyRegister';
import RegistrationCategory from './Landing/RegisterCategory';
import Login from './test/testlogin';
import LoginPage from './auth/login';
import AdminSideBar from './Admin/Sidebar';
import ClientManagement from './Admin/ClientManagement';
import CompanyManagement from './Admin/CompanyManagement';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/ClientManagement" element={<Login />} />
          <Route path="/client-register" element={<ClientRegister />} />
          <Route path="/Company-register" element={<CompanyRegister />} />
          <Route path="/register-category" element={<RegistrationCategory/>} />
          <Route path="/admin-dashboard" element={<AdminSideBar />} />
          <Route path="/Client" element={<ClientManagement />} />
          <Route path="/" element={<CompanyManagement/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
