// client/src/components/common/AvatarUpload.js - WITH INSTANT PREVIEW
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadAvatar, removeAvatar } from '../../store/slices/authSlice';
import {
    CameraIcon,
    TrashIcon,
    UserIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const AvatarUpload = ({ 
    size = 'large', 
    showControls = true, 
    className = '',
    onUploadStart,
    onUploadComplete,
    onUploadError 
}) => {
    const dispatch = useDispatch();
    const { user, avatarUploading } = useSelector((state) => state.auth);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const sizeClasses = {
        small: 'h-12 w-12',
        medium: 'h-20 w-20',
        large: 'h-32 w-32',
        xlarge: 'h-40 w-40'
    };

    const iconSizes = {
        small: 'h-3 w-3',
        medium: 'h-4 w-4', 
        large: 'h-5 w-5',
        xlarge: 'h-6 w-6'
    };

    // Check if user has an avatar (or preview)
    const hasAvatar = user?.profile?.avatar || preview;

    const handleFileClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const validateFile = (file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            throw new Error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        }

        if (file.size > maxSize) {
            throw new Error('File size must be less than 5MB');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Validate file first
            validateFile(file);

            // INSTANT PREVIEW - Show immediately
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log('Setting preview image');
                setPreview(event.target.result);
            };
            reader.readAsDataURL(file);

            // Start upload process
            setIsUploading(true);
            if (onUploadStart) onUploadStart();

            // Upload file using Redux action
            const result = await dispatch(uploadAvatar(file)).unwrap();
            
            // Clear preview after successful upload (Redux will have updated user.profile.avatar)
            setPreview(null);
            setIsUploading(false);
            window.location.reload(); // Reload to reflect changes immediately
            
            if (onUploadComplete) onUploadComplete(result);

        } catch (error) {
            // Clear preview on error
            setPreview(null);
            setIsUploading(false);
            
            if (onUploadError) onUploadError(error.message);
            console.error('Avatar upload error:', error);
        }

        // Clear the file input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user?.profile?.avatar && !preview) return;

        // If there's only a preview (not uploaded yet), just clear it
        if (preview && !user?.profile?.avatar) {
            setPreview(null);
            return;
        }

        try {
            await dispatch(removeAvatar()).unwrap();
            setPreview(null);
        } catch (error) {
            alert('Failed to remove avatar. Please try again.');
        }
    };

    const getAvatarDisplay = () => {
        const avatarUrl = user?.profile?.avatar;
        const firstName = user?.profile?.firstName;
        const lastName = user?.profile?.lastName;

        // PRIORITY 1: Show preview if available (instant preview)
        if (preview) {
            return (
                <div className="relative">
                    <img 
                        src={preview} 
                        alt="Avatar preview" 
                        className={`${sizeClasses[size]} rounded-full object-cover`}
                    />
                    {/* Upload progress indicator */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <LoadingSpinner size="sm" color="white" />
                        </div>
                    )}
                </div>
            );
        }

        // PRIORITY 2: Show actual uploaded avatar if exists
        if (avatarUrl) {
            return (
                <img 
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${avatarUrl}`} 
                    alt="Profile" 
                    className={`${sizeClasses[size]} rounded-full object-cover`}
                    onError={(e) => {
                        console.error('Failed to load avatar image:', e.target.src);
                        // You could set a fallback here if needed
                    }}
                />
            );
        }

        // PRIORITY 3: Show initials when no avatar
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center avatar-fallback`}>
                {firstName && lastName ? (
                    <span className={`font-bold text-white ${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-3xl'}`}>
                        {firstName[0]}{lastName[0]}
                    </span>
                ) : (
                    <UserIcon className={`${iconSizes[size]} text-white`} />
                )}
            </div>
        );
    };

    const getControlButtons = () => {
        if (!showControls) return null;

        return (
            <div className="absolute bottom-0 right-0 flex space-x-1">
                {/* Always show upload/change button */}
                <button 
                    onClick={handleFileClick}
                    disabled={avatarUploading || isUploading}
                    className="bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    title={hasAvatar ? "Change profile picture" : "Add profile picture"}
                >
                    {hasAvatar ? (
                        <CameraIcon className={iconSizes[size]} />
                    ) : (
                        <PlusIcon className={iconSizes[size]} />
                    )}
                </button>
                
                {/* Show remove button if avatar exists OR there's a preview */}
                {hasAvatar && (
                    <button 
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading || isUploading}
                        className="bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors"
                        title={preview ? "Cancel upload" : "Remove profile picture"}
                    >
                        <TrashIcon className={`${iconSizes[size]} text-red-600`} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Avatar Display */}
            {(avatarUploading && !preview) ? (
                <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center`}>
                    <LoadingSpinner size={size === 'small' ? 'sm' : 'md'} />
                </div>
            ) : (
                getAvatarDisplay()
            )}

            {/* Controls */}
            {getControlButtons()}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};

export default AvatarUpload;