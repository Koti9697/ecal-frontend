// In src/screens/MyProfileScreen.tsx

import { useState, useEffect, ReactNode } from 'react';
import { useForm, FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FormError } from '../components/ui/FormError';
import toast from 'react-hot-toast';
import { useAppSelector } from '../store/hooks';

interface ProfileSettings {
    allow_user_account_closure: boolean;
}

export function MyProfileScreen() {
    const api = useApi();
    const user = useAppSelector(state => state.auth.user);
    
    const { register: detailsRegister, handleSubmit: handleDetailsSubmit, reset: resetDetails, formState: { errors: detailsErrors } } = useForm();
    const { register: passwordRegister, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch: watchPassword, formState: { errors: passwordErrors } } = useForm();
    const { register: closeRegister, handleSubmit: handleCloseSubmit, formState: { errors: closeErrors } } = useForm();

    const newPassword = watchPassword("new_password");
    const [settings, setSettings] = useState<ProfileSettings | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api('/my-profile/');
                resetDetails({
                    first_name: response.first_name,
                    last_name: response.last_name,
                    email: response.email
                });
                setSettings(response.settings);
            } catch {
                toast.error("Failed to load profile information.");
            }
        };
        fetchProfile();
    }, [api, resetDetails]);
    
    const onDetailsSubmit = async (data: any) => {
        try {
            await api('/my-profile/update-details/', { method: 'PUT', data });
            toast.success("Profile details updated successfully.");
        } catch (err: any) {
            toast.error(`Update failed: ${err.data?.detail || 'An error occurred.'}`);
        }
    };

    const onPasswordSubmit = async (data: any) => {
        try {
            await api('/my-profile/change-password/', { method: 'POST', data });
            toast.success("Password changed successfully.");
            resetPassword();
        } catch (err: any) {
            const errorMessages = Object.values(err.data).flat().join(' ');
            toast.error(`Change failed: ${errorMessages || 'An error occurred.'}`);
        }
    };
    
    const onAccountClose = async (data: any) => {
        if (window.confirm("Are you sure you want to close your account? This action cannot be undone and you will be logged out immediately.")) {
             try {
                await api('/my-profile/close-account/', { method: 'POST', data });
                toast.success("Your account has been closed. You will be logged out.");
            } catch (err: any) {
                toast.error(`Action failed: ${err.data?.detail || 'An error occurred.'}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-800">My Profile ({user?.username})</h3>

            <Card title="Update Your Details">
                <form onSubmit={handleDetailsSubmit(onDetailsSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">First Name</label>
                            <input {...detailsRegister('first_name')} className="input-style mt-1" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Last Name</label>
                            <input {...detailsRegister('last_name')} className="input-style mt-1" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email Address</label>
                        <input type="email" {...detailsRegister('email')} className="input-style mt-1" />
                    </div>
                     <hr/>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Current Password <span className="text-red-500">*</span></label>
                        <input type="password" {...detailsRegister('current_password', { required: "Your current password is required to save changes."})} className="input-style mt-1" />
                        <FormError>{detailsErrors.current_password?.message as ReactNode}</FormError>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Reason for Change <span className="text-red-500">*</span></label>
                        <input {...detailsRegister('reason', { required: "A reason is required for audit purposes."})} className="input-style mt-1" />
                        <FormError>{detailsErrors.reason?.message as ReactNode}</FormError>
                    </div>
                    <div className="pt-4 border-t flex justify-end"><Button type="submit">Save Details</Button></div>
                </form>
            </Card>

            <Card title="Change Password">
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Current Password <span className="text-red-500">*</span></label>
                        <input type="password" {...passwordRegister('current_password', { required: "Your current password is required."})} className="input-style mt-1" />
                        <FormError>{passwordErrors.current_password?.message as ReactNode}</FormError>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">New Password <span className="text-red-500">*</span></label>
                            <input type="password" {...passwordRegister('new_password', { required: "A new password is required."})} className="input-style mt-1" />
                             <FormError>{passwordErrors.new_password?.message as ReactNode}</FormError>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Confirm New Password <span className="text-red-500">*</span></label>
                            <input type="password" {...passwordRegister('confirm_password', { required: "Please confirm your new password.", validate: value => value === newPassword || "The passwords do not match"})} className="input-style mt-1" />
                             <FormError>{passwordErrors.confirm_password?.message as ReactNode}</FormError>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Reason for Change <span className="text-red-500">*</span></label>
                        <input {...passwordRegister('reason', { required: "A reason is required for audit purposes."})} className="input-style mt-1" />
                        <FormError>{passwordErrors.reason?.message as ReactNode}</FormError>
                    </div>
                    <div className="pt-4 border-t flex justify-end"><Button type="submit">Change Password</Button></div>
                </form>
            </Card>

            {settings?.allow_user_account_closure && (
                <Card title="Close Your Account">
                    <form onSubmit={handleCloseSubmit(onAccountClose)} className="space-y-4">
                        <p className="text-sm text-red-600">Warning: This will permanently disable your account. This action is irreversible.</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Confirm with Password <span className="text-red-500">*</span></label>
                            <input type="password" {...closeRegister('password', { required: "Your password is required to close your account."})} className="input-style mt-1" />
                            <FormError>{closeErrors.password?.message as ReactNode}</FormError>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Reason for Closure <span className="text-red-500">*</span></label>
                            <input {...closeRegister('reason', { required: "A reason is required for audit purposes."})} className="input-style mt-1" />
                            <FormError>{closeErrors.reason?.message as ReactNode}</FormError>
                        </div>
                        <div className="pt-4 border-t flex justify-end"><Button type="submit" variant="danger">Close Account</Button></div>
                    </form>
                </Card>
            )}
        </div>
    );
}