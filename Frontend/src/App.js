import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientRegister from './auth/ClientRegister';
import LandingPage from './Landing';
import CompanyRegister from './auth/CompanyRegister';
import RegistrationCategory from './Landing/RegisterCategory';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/client-register" element={<ClientRegister />} />
          <Route path="/Company-register" element={<CompanyRegister />} />
          <Route path="/register-category" element={<RegistrationCategory/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
