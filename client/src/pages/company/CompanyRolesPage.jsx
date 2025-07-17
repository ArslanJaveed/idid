import React, { useState, useEffect } from 'react';
import roleService from '../../api/roleService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const CompanyRolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [errors, setErrors] = useState({});

    // State for Add/Edit Role Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState(null); // Role being edited, null for new role
    const [roleFormData, setRoleFormData] = useState({
        role_name: '',
        description: '',
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalErrors, setModalErrors] = useState({});

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        setMessage('');
        setMessageType('info');
        try {
            const response = await roleService.getRoles();
            setRoles(response.data.roles);
            setMessage('Roles loaded successfully.');
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load roles.');
            setMessageType('error');
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleFormChange = (e) => {
        const { name, value } = e.target;
        setRoleFormData({ ...roleFormData, [name]: value });
        setModalErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    };

    const openCreateModal = () => {
        setCurrentRole(null);
        setRoleFormData({ role_name: '', description: '' });
        setModalErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (role) => {
        setCurrentRole(role);
        setRoleFormData({ role_name: role.role_name, description: role.description });
        setModalErrors({});
        setIsModalOpen(true);
    };

    const closeRoleModal = () => {
        setIsModalOpen(false);
        setCurrentRole(null);
        setRoleFormData({ role_name: '', description: '' });
        setModalErrors({});
        setMessage(''); // Clear main message as well
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalErrors({});
        setMessage(''); // Clear main message

        try {
            let response;
            if (currentRole) {
                // Update existing role
                response = await roleService.updateRole(currentRole.id, roleFormData);
            } else {
                // Create new role
                response = await roleService.createRole(roleFormData);
            }
            setMessage(response.data.message);
            setMessageType('success');
            closeRoleModal();
            fetchRoles(); // Refresh roles list
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setModalErrors(error.response.data.errors);
                setMessage('Please correct the errors in the form.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to save role.');
                setMessageType('error');
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (window.confirm('Are you sure you want to delete this role? This cannot be undone and will affect assigned employees.')) {
            setLoading(true);
            setMessage('');
            setMessageType('info');
            try {
                const response = await roleService.deleteRole(roleId);
                setMessage(response.data.message);
                setMessageType('success');
                fetchRoles(); // Refresh roles list
            } catch (error) {
                setMessage(error.response?.data?.message || 'Failed to delete role.');
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
                <p className="ml-2 text-gray-700">Loading roles...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Company Roles</h1>

            <div className="flex justify-between items-center mb-6">
                <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
                <button
                    onClick={openCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                >
                    Add New Role
                </button>
            </div>

            {roles.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                    <p>No roles defined yet. Click "Add New Role" to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {roles.map((role) => (
                                <tr key={role.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {role.role_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {role.description || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(role)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRole(role.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Role Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10 font-inter" onClose={closeRoleModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        {currentRole ? 'Edit Role' : 'Add New Role'}
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <form onSubmit={handleSaveRole} className="space-y-4">
                                            <div>
                                                <label htmlFor="role_name" className="block text-sm font-medium text-gray-700">Role Name</label>
                                                <input
                                                    type="text"
                                                    name="role_name"
                                                    id="role_name"
                                                    value={roleFormData.role_name}
                                                    onChange={handleRoleFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                                    required
                                                />
                                                {modalErrors.role_name && <p className="text-red-500 text-xs mt-1">{modalErrors.role_name[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                                <textarea
                                                    name="description"
                                                    id="description"
                                                    value={roleFormData.description}
                                                    onChange={handleRoleFormChange}
                                                    rows="3"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                                ></textarea>
                                                {modalErrors.description && <p className="text-red-500 text-xs mt-1">{modalErrors.description[0]}</p>}
                                            </div>
                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                    onClick={closeRoleModal}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={modalLoading}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                >
                                                    {modalLoading ? <LoadingSpinner /> : (currentRole ? 'Update Role' : 'Create Role')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default CompanyRolesPage;
