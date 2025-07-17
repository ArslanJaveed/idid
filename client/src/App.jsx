import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import AppRoutes from './routes/AppRoutes';
// import useAuth from './hooks/useAuth';

function App() {
  
  return (
    <Router>
      <AuthProvider> 
        <div className="font-inter antialiased">
          <AppRoutes /> 
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
