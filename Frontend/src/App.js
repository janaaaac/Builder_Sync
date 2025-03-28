// App.js or your main router file
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import LoginTest from './test/testlogin';
import TestClientManagement from './test/testclientManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginTest />} />
        <Route path="/client-management" element={<TestClientManagement/>} />
        {/* Add a catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;