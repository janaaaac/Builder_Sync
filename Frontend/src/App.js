import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientRegister from './auth/ClientRegister';
import LandingPage from './Landing';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<ClientRegister />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
