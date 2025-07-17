import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';

const EmployeeLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [errors, setErrors] = useState({});

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('info');
        setErrors({});

        try {
            const response = await axiosInstance.post('/employee/login', { email, password });
            setMessage(response.data.message);
            setMessageType('success');
            login(response.data.token, 'employee', response.data.employee);
            navigate('/employee-dashboard'); // Redirect to employee dashboard
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please check your input.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Login failed. Please check your credentials.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl border border-gray-200">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">Employee Login</h2>
                <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
                <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <input id="email-address" name="email" type="email" autoComplete="email" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Employee Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                    </div>

                    <button type="submit" disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {loading ? <LoadingSpinner /> : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmployeeLoginPage;
