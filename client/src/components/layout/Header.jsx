import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
    const { currentUser, userType, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        if (userType === 'company') {
            navigate('/company-login');
        } else {
            navigate('/employee-login');
        }
    };

    return (
        <header className="bg-indigo-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to={userType === 'company' ? '/company-dashboard' : '/employee-dashboard'} className="text-2xl font-bold rounded-md px-2 py-1 hover:bg-indigo-700 transition duration-200">
                    SaaS App
                </Link>
                <nav className="flex items-center space-x-4">
                    {currentUser && (
                        <span className="text-sm">
                            Welcome, <span className="font-semibold">{currentUser.name || currentUser.company_name}</span>
                            {userType === 'company' && ` (Admin - ${currentUser.company_code})`}
                            {userType === 'employee' && ` (Employee - ${currentUser.employee_id_code})`}
                        </span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                    >
                        Logout
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default Header;
