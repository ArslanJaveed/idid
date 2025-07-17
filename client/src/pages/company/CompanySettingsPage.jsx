import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import companyService from '../../api/companyService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';

const CompanySettingsPage = () => {
    const { currentUser, login, loadingAuth } = useAuth(); // Get login to update currentUser after settings change
    const [formData, setFormData] = useState({
        company_name: '',
        company_type: 'Tech',
        custom_company_type: '',
        country: '',
        city: '',
        address: '',
        default_check_in_time: '',
        default_check_out_time: '',
        late_check_in_grace_period_minutes: 0,
        company_image_url: '',
    });
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    const companyTypes = ['Tech', 'Logistics', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other'];

    useEffect(() => {
        if (!loadingAuth && currentUser) {
            // Populate form with current user data
            setFormData({
                company_name: currentUser.company_name || '',
                company_type: currentUser.company_type || 'Tech',
                custom_company_type: currentUser.custom_company_type || '',
                country: currentUser.country || '',
                city: currentUser.city || '',
                address: currentUser.address || '',
                default_check_in_time: currentUser.default_check_in_time || '',
                default_check_out_time: currentUser.default_check_out_time || '',
                late_check_in_grace_period_minutes: currentUser.late_check_in_grace_period_minutes || 0,
                company_image_url: currentUser.company_image_url || '',
            });
            setLoading(false);
        }
    }, [currentUser, loadingAuth]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseInt(value, 10) : value,
        });
        setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const payload = { ...formData };
            if (payload.company_type !== 'Other') {
                payload.custom_company_type = null; // Clear if not 'Other'
            }

            const response = await companyService.updateCompanySettings(payload);
            setMessage(response.data.message);
            setMessageType('success');
            // Update the global AuthContext with the new company data
            login(localStorage.getItem('authToken'), 'company', response.data.company);
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please correct the errors in the form.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'An unexpected error occurred while updating settings.');
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingAuth || loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
                <p className="ml-2 text-gray-700">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Company Settings</h1>

            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 border border-gray-200 space-y-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="col-span-full">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea name="address" id="address" value={formData.address} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" rows="3" required></textarea>
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>}
                    </div>
                    <div className="col-span-full">
                        <label htmlFor="company_image_url" className="block text-sm font-medium text-gray-700">Company Image URL (Optional)</label>
                        <input type="url" name="company_image_url" id="company_image_url" value={formData.company_image_url} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" />
                        {errors.company_image_url && <p className="text-red-500 text-xs mt-1">{errors.company_image_url[0]}</p>}
                        {formData.company_image_url && (
                            <img src={formData.company_image_url} alt="Company Logo" className="mt-2 h-20 w-20 object-contain rounded-md border border-gray-200" />
                        )}
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 pt-6">Attendance Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="default_check_in_time" className="block text-sm font-medium text-gray-700">Default Check-in Time</label>
                        <input type="time" name="default_check_in_time" id="default_check_in_time" value={formData.default_check_in_time} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" />
                        {errors.default_check_in_time && <p className="text-red-500 text-xs mt-1">{errors.default_check_in_time[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="default_check_out_time" className="block text-sm font-medium text-gray-700">Default Check-out Time</label>
                        <input type="time" name="default_check_out_time" id="default_check_out_time" value={formData.default_check_out_time} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" />
                        {errors.default_check_out_time && <p className="text-red-500 text-xs mt-1">{errors.default_check_out_time[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="late_check_in_grace_period_minutes" className="block text-sm font-medium text-gray-700">Late Check-in Grace Period (minutes)</label>
                        <input type="number" name="late_check_in_grace_period_minutes" id="late_check_in_grace_period_minutes" value={formData.late_check_in_grace_period_minutes} onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" min="0" />
                        {errors.late_check_in_grace_period_minutes && <p className="text-red-500 text-xs mt-1">{errors.late_check_in_grace_period_minutes[0]}</p>}
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-6">
                    {loading ? <LoadingSpinner /> : 'Save Settings'}
                </button>
            </form>
        </div>
    );
};

export default CompanySettingsPage;
