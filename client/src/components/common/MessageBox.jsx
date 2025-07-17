import React from 'react';

const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                    type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                    'bg-blue-100 border-blue-400 text-blue-700';
    const borderColor = type === 'success' ? 'border-green-500' :
                        type === 'error' ? 'border-red-500' :
                        'border-blue-500';

    return (
        <div className={`relative px-4 py-3 rounded-md border ${bgColor} ${borderColor} mb-4`} role="alert">
            <strong className="font-bold mr-1">{type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info!'}</strong>
            <span className="block sm:inline">{message}</span>
            {onClose && (
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={onClose}>
                    <svg className="fill-current h-6 w-6 text-gray-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.697l-2.651 3.152a1.2 1.2 0 1 1-1.697-1.697L8.303 10 5.152 7.348a1.2 1.2 0 0 1 1.697-1.697L10 8.303l2.651-3.152a1.2 1.2 0 1 1 1.697 1.697L11.697 10l3.152 2.651a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            )}
        </div>
    );
};

export default MessageBox;
