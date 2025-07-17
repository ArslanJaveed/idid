import React, { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance'; // Use the configured axios instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [userType, setUserType] = useState(localStorage.getItem('userType')); // 'company' or 'employee'
    const [currentUser, setCurrentUser] = useState(null); // Company or Employee object
    const [loadingAuth, setLoadingAuth] = useState(true); // To indicate if auth status is being checked

    // Function to load user data from backend and set state
    const loadUserData = useCallback(async () => {
        setLoadingAuth(true);
        if (!authToken) {
            setCurrentUser(null);
            setUserType(null);
            setLoadingAuth(false);
            return;
        }

        try {
            const response = await axiosInstance.get('user');
            const userData = response.data;
            if (userData && userData.company_code) {
                setUserType('company');
                setCurrentUser(userData);
                localStorage.setItem('userType', 'company');
                localStorage.setItem('companyDetails', JSON.stringify(userData));
                localStorage.removeItem('employeeDetails'); 
            } else if (userData && userData.employee_id_code) { 
                setUserType('employee');
                setCurrentUser(userData);
                localStorage.setItem('userType', 'employee');
                localStorage.setItem('employeeDetails', JSON.stringify(userData));
                localStorage.removeItem('companyDetails'); // Clear other type's details
            } else {
                // If user data doesn't match expected types, clear auth
                console.warn('Authenticated user data does not match known types, logging out.');
                // Use the internal logout, but don't call backend again to avoid loop
                _clearAuthData();
            }
        } catch (error) {
            console.error('Failed to fetch user details on refresh:', error);
            // If fetching /user fails (e.g., 401 Unauthorized), clear auth
            _clearAuthData();
        } finally {
            setLoadingAuth(false);
        }
    }, [authToken]);

    // Internal function to clear authentication data from state and local storage
    const _clearAuthData = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('companyDetails');
        localStorage.removeItem('employeeDetails');
        setAuthToken(null);
        setUserType(null);
        setCurrentUser(null);
    }, []);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const login = useCallback((token, type, userData) => {
        localStorage.setItem('authToken', token);
        // Update authToken state to trigger loadUserData, which will then set userType and currentUser
        setAuthToken(token);
        // Optionally, for immediate UI update after login, you can set them here
        // However, loadUserData will be the source of truth from the backend
        setUserType(type);
        setCurrentUser(userData);
    }, []);

    const logout = useCallback(async () => {
        setLoadingAuth(true);
        try {
            // Only attempt backend logout if an authToken exists
            if (authToken) {
                if (userType === 'company') {
                    await axiosInstance.post('/company/logout');
                } else if (userType === 'employee') {
                    await axiosInstance.post('/employee/logout');
                } else {
                    // Fallback generic logout if userType is unknown but token exists
                    await axiosInstance.post('/logout');
                }
                console.log("Logout successful on backend.");
            } else {
                console.log("No auth token found, skipping backend logout.");
            }
        } catch (error) {
            console.error("Logout failed on backend:", error);
            // Log the error but proceed to clear local state regardless
        } finally {
            _clearAuthData(); // Always clear local state after logout attempt
            setLoadingAuth(false);
        }
    }, [authToken, userType, _clearAuthData]);

    const isAuthenticatedUser = !!authToken && !!currentUser;

    return (
        <AuthContext.Provider value={{ authToken, userType, currentUser, isAuthenticated: isAuthenticatedUser, loadingAuth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
