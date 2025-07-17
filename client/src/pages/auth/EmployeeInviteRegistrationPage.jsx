import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';

const EmployeeInviteRegistrationPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Hook to read URL query parameters
    const employeeIdFromUrl = searchParams.get('employee_id');
    const tokenFromUrl = searchParams.get('token');

    const [currentStage, setCurrentStage] = useState('VERIFY_INVITE'); // 'VERIFY_INVITE', 'COMPLETE_PROFILE', 'SET_PASSWORD', 'OTP_VERIFICATION', 'SUCCESS'
    const [employeeDetails, setEmployeeDetails] = useState(null); // Details fetched after invite verification
    const [formData, setFormData] = useState({
        name: '',
        profile_image_url: '',
        employee_id_code: '', // This will be pre-filled after invite verification
    });
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [otp, setOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        const verifyInviteLink = async () => {
            if (!employeeIdFromUrl || !tokenFromUrl) {
                setMessage('Invalid invitation link. Missing employee ID or token.');
                setMessageType('error');
                setLoading(false);
                return;
            }

            setLoading(true);
            setMessage('Verifying invitation link...');
            setMessageType('info');

            try {
                const response = await axiosInstance.post('/employee/verify-invite', {
                    employee_id: employeeIdFromUrl,
                    token: tokenFromUrl,
                });
                setEmployeeDetails(response.data.employee);
                setFormData(prev => ({
                    ...prev,
                    name: response.data.employee.name,
                    employee_id_code: response.data.employee.employee_id_code,
                    profile_image_url: response.data.employee.profile_image_url || '',
                }));
                setMessage(response.data.message);
                setMessageType('success');
                setCurrentStage('COMPLETE_PROFILE');
            } catch (error) {
                setMessage(error.response?.data?.message || 'Failed to verify invitation link.');
                setMessageType('error');
                setErrors(error.response?.data?.errors || {});
            } finally {
                setLoading(false);
            }
        };

        if (currentStage === 'VERIFY_INVITE') {
            verifyInviteLink();
        }
    }, [employeeIdFromUrl, tokenFromUrl, currentStage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    };

    const handleProfileCompletion = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const response = await axiosInstance.post('/employee/complete-profile', {
                employee_id: employeeDetails.id,
                name: formData.name,
                profile_image_url: formData.profile_image_url,
                employee_id_code: formData.employee_id_code, // Ensure this is sent back
            });
            setEmployeeDetails(response.data.employee); // Update with new employee details
            setMessage(response.data.message);
            setMessageType('success');
            setCurrentStage('SET_PASSWORD');
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please correct the errors in your profile details.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to complete profile.');
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
            const response = await axiosInstance.post('/employee/set-password-verify-email', {
                employee_id: employeeDetails.id,
                password: password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(response.data.message);
            setMessageType('success');
            setCurrentStage('OTP_VERIFICATION');
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please correct the errors for password setup.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to set password.');
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
            const response = await axiosInstance.post('/employee/verify-otp', {
                employee_id: employeeDetails.id,
                otp_code: otp,
            });
            setMessage(response.data.message);
            setMessageType('success');
            setCurrentStage('SUCCESS');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setMessage(error.response.data.message);
                setMessageType('error');
            } else if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please enter a valid OTP.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to verify OTP.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderVerifyInvite = () => (
        <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Employee Invitation</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
            {loading && <LoadingSpinner />}
            {!loading && messageType === 'error' && (
                <p className="text-gray-600">Please ensure you are using a valid and unexpired invitation link.</p>
            )}
        </div>
    );

    const renderCompleteProfile = () => (
        <form onSubmit={handleProfileCompletion} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
            <div className="bg-blue-50 p-4 rounded-md text-blue-800 border border-blue-200">
                <p className="font-semibold">Company Assigned Details:</p>
                <p><strong>Company:</strong> {employeeDetails?.company?.company_name || 'N/A'}</p>
                <p><strong>Your Employee ID:</strong> {employeeDetails?.employee_id_code || 'N/A'}</p>
                <p><strong>Your Email:</strong> {employeeDetails?.email || 'N/A'}</p>
                <p><strong>Your Role:</strong> {employeeDetails?.role?.role_name || 'N/A'}</p>
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Full Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
            </div>
            <div>
                <label htmlFor="employee_id_code" className="block text-sm font-medium text-gray-700">Confirm Employee ID</label>
                <input type="text" name="employee_id_code" id="employee_id_code" value={formData.employee_id_code} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                {errors.employee_id_code && <p className="text-red-500 text-xs mt-1">{errors.employee_id_code[0]}</p>}
            </div>
            <div>
                <label htmlFor="profile_image_url" className="block text-sm font-medium text-gray-700">Profile Image URL (Optional)</label>
                <input type="url" name="profile_image_url" id="profile_image_url" value={formData.profile_image_url} onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" />
                {errors.profile_image_url && <p className="text-red-500 text-xs mt-1">{errors.profile_image_url[0]}</p>}
            </div>

            <p className="text-sm text-gray-600">By clicking "Accept Enrollment", you confirm your details and join {employeeDetails?.company?.company_name}.</p>
            <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? <LoadingSpinner /> : 'Accept Enrollment & Complete Profile'}
            </button>
        </form>
    );

    const renderSetPassword = () => (
        <form onSubmit={handlePasswordSetup} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Set Your Login Password</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
            <p className="text-gray-600">Set a strong password for your account to log in later.</p>
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
            <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? <LoadingSpinner /> : 'Set Password'}
            </button>
        </form>
    );

    const renderOtpVerification = () => (
        <form onSubmit={handleOtpVerify} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Verify Your Email (OTP)</h2>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
            <p className="text-gray-600">An OTP has been sent to your email ({employeeDetails?.email}). Please enter it below.</p>
            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">OTP Code</label>
                <input type="text" name="otp" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" maxLength="6" required />
                {errors.otp_code && <p className="text-red-500 text-xs mt-1">{errors.otp_code[0]}</p>}
            </div>
            <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? <LoadingSpinner /> : 'Verify OTP & Complete Registration'}
            </button>
        </form>
    );

    const renderSuccess = () => (
        <div className="text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-green-600">Registration Complete! 🎉</h2>
            <p className="text-lg text-gray-800">{message}</p>
            <p className="text-gray-700">Your employee account has been successfully set up. You can now log in.</p>
            <button onClick={() => navigate('/employee-login')}
                className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                Go to Employee Login
            </button>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl border border-gray-200">
                {currentStage === 'VERIFY_INVITE' && renderVerifyInvite()}
                {currentStage === 'COMPLETE_PROFILE' && renderCompleteProfile()}
                {currentStage === 'SET_PASSWORD' && renderSetPassword()}
                {currentStage === 'OTP_VERIFICATION' && renderOtpVerification()}
                {currentStage === 'SUCCESS' && renderSuccess()}
            </div>
        </div>
    );
};

export default EmployeeInviteRegistrationPage;
