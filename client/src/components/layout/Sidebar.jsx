import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
    const { userType } = useAuth();

    const companyNavItems = [
        { name: 'Dashboard', path: '/company-dashboard' },
        { name: 'Employees', path: '/company-employees' },
        { name: 'Roles', path: '/company-roles' },
        { name: 'Settings', path: '/company-settings' },
    ];

    const employeeNavItems = [
        { name: 'Dashboard', path: '/employee-dashboard' },
        { name: 'Attendance History', path: '/employee-attendance-history' },
        // { name: 'Daily Tasks', path: '/employee-daily-tasks' }, // Can be part of dashboard
    ];

    const navItems = userType === 'company' ? companyNavItems : employeeNavItems;

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col shadow-lg">
            <div className="p-4 text-2xl font-bold text-center border-b border-gray-700">
                Menu
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2 rounded-md text-gray-300 hover:bg-indigo-700 hover:text-white transition duration-200 ease-in-out
                            ${isActive ? 'bg-indigo-700 text-white font-semibold' : ''}`
                        }
                    >
                        {item.name}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
