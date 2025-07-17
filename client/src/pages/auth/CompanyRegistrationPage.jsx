import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance'; // Use the configured axios instance
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';

const CompanyRegistrationPage = () => {
    const navigate = useNavigate();
    const [currentStage, setCurrentStage] = useState('REGISTER'); // 'REGISTER', 'OTP_VERIFICATION', 'PASSWORD_SETUP', 'SUCCESS'
    const [formData, setFormData] = useState({
        email: '',
        company_name: '',
        company_type: 'Tech', // Default value for dropdown
        custom_company_type: '',
        country: '',
        city: '',
        address: '',
        terms_accepted: false,
    });
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [companyCode, setCompanyCode] = useState('');
    const [companyId, setCompanyId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    const companyTypes = ['Tech', 'Logistics', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other'];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const payload = { ...formData };
            if (payload.company_type !== 'Other') {
                delete payload.custom_company_type;
            }

            const response = await axiosInstance.post('/company/register', payload);
            setMessage(response.data.message);
            setMessageType('success');
            setCompanyId(response.data.company_id);
            setCurrentStage('OTP_VERIFICATION');
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please correct the errors in the form.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'An unexpected error occurred during registration.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const response = await axiosInstance.post('/company/verify-otp', {
                company_id: companyId,
                otp_code: otp,
            });
            setMessage(response.data.message);
            setMessageType('success');
            setCurrentStage('PASSWORD_SETUP');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setMessage(error.response.data.message);
                setMessageType('error');
            } else if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please enter a valid OTP.');
                setMessageType('error');
            }
            else {
                setMessage(error.response?.data?.message || 'An unexpected error occurred during OTP verification.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSetup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const response = await axiosInstance.post('/company/set-password-code', {
                company_id: companyId,
                password: password,
                password_confirmation: passwordConfirmation,
                company_code: companyCode,
            });
            setMessage(response.data.message);
            setMessageType('success');
            setCurrentStage('SUCCESS');
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please correct the errors for password and company code.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'An unexpected error occurred during password setup.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderRegistrationForm = () => (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Company Registration</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Company Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>
            <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" name="company_name" id="company_name" value={formData.company_name} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name[0]}</p>}
            </div>
            <div>
                <label htmlFor="company_type" className="block text-sm font-medium text-gray-700">Company Type</label>
                <select name="company_type" id="company_type" value={formData.company_type} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required>
                    {companyTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
                {errors.company_type && <p className="text-red-500 text-xs mt-1">{errors.company_type[0]}</p>}
            </div>
            {formData.company_type === 'Other' && (
                <div>
                    <label htmlFor="custom_company_type" className="block text-sm font-medium text-gray-700">Specify Other Type</label>
                    <input type="text" name="custom_company_type" id="custom_company_type" value={formData.custom_company_type} onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                    {errors.custom_company_type && <p className="text-red-500 text-xs mt-1">{errors.custom_company_type[0]}</p>}
                </div>
            )}
            <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" name="country" id="country" value={formData.country} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country[0]}</p>}
            </div>
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                <input type="text" name="city" id="city" value={formData.city} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city[0]}</p>}
            </div>
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <textarea name="address" id="address" value={formData.address} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" rows="3" required></textarea>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>}
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="terms_accepted" id="terms_accepted" checked={formData.terms_accepted} onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" required />
                <label htmlFor="terms_accepted" className="ml-2 block text-sm text-gray-900">I agree to the terms and conditions</label>
                {errors.terms_accepted && <p className="text-red-500 text-xs mt-1">{errors.terms_accepted[0]}</p>}
            </div>
            <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? <LoadingSpinner /> : 'Register Company'}
            </button>
        </form>
    );

    const renderOtpVerificationForm = () => (
        <form onSubmit={handleOtpVerify} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Verify Your Email (OTP)</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
            <p className="text-gray-600">An OTP has been sent to your email ({formData.email}). Please enter it below.</p>
            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">OTP Code</label>
                <input type="text" name="otp" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" maxLength="6" required />
                {errors.otp_code && <p className="text-red-500 text-xs mt-1">{errors.otp_code[0]}</p>}
            </div>
            <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? <LoadingSpinner /> : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => setCurrentStage('REGISTER')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2">
                Back
            </button>
        </form>
    );

    const renderPasswordSetupForm = () => (
        <form onSubmit={handlePasswordSetup} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Set Your Password & Company Code</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>
            <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input type="password" name="password_confirmation" id="password_confirmation" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
            </div>
            <div>
                <label htmlFor="company_code" className="block text-sm font-medium text-gray-700">4-Digit Company Code</label>
                <input type="text" name="company_code" id="company_code" value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" maxLength="4" required />
                {errors.company_code && <p className="text-red-500 text-xs mt-1">{errors.company_code[0]}</p>}
            </div>
            <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? <LoadingSpinner /> : 'Set Password & Code'}
            </button>
            <button type="button" onClick={() => setCurrentStage('OTP_VERIFICATION')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2">
                Back
            </button>
        </form>
    );

    const renderSuccessPage = () => (
        <div className="text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-green-600">Registration Complete! 🎉</h2>
            <p className="text-lg text-gray-800">{message}</p>
            <p className="text-gray-700">Your company profile has been successfully created. You can now log in to your admin dashboard.</p>

            <div className="bg-gray-50 p-8 rounded-xl shadow-inner border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Company Demo Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <p><strong>Company Name:</strong> <span className="font-medium text-gray-900">{formData.company_name}</span></p>
                    <p><strong>Company Email:</strong> <span className="font-medium text-gray-900">{formData.email}</span></p>
                    <p><strong>Company Type:</strong> <span className="font-medium text-gray-900">{formData.company_type === 'Other' ? formData.custom_company_type : formData.company_type}</span></p>
                    <p><strong>Location:</strong> <span className="font-medium text-gray-900">{formData.city}, {formData.country}</span></p>
                    <p className="col-span-full"><strong>Your Company Code:</strong> <span className="font-bold text-indigo-700 text-xl">{companyCode}</span></p>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                    (Company image upload and further detailed settings will be available from your admin dashboard after you log in.)
                </p>
            </div>

            <button onClick={() => navigate('/company-login')}
                className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                Go to Login
            </button>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl border border-gray-200">
                {currentStage === 'REGISTER' && renderRegistrationForm()}
                {currentStage === 'OTP_VERIFICATION' && renderOtpVerificationForm()}
                {currentStage === 'PASSWORD_SETUP' && renderPasswordSetupForm()}
                {currentStage === 'SUCCESS' && renderSuccessPage()}
            </div>
        </div>
    );
};

export default CompanyRegistrationPage;
