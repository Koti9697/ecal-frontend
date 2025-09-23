// In src/screens/LoginScreen.tsx

import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { FormError } from '../components/ui/FormError';
import { useApi } from '../hooks/useApi'; // --- 1. IMPORT THE useApi HOOK ---
import { isAxiosError } from 'axios';

type LoginFormInputs = {
    username: string;
    password: string;
};

export function LoginScreen() {
    const dispatch = useAppDispatch();
    const api = useApi(); // --- 2. INITIALIZE THE useApi HOOK ---
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>();

    const onSubmit = async (data: LoginFormInputs) => {
        try {
            // --- 3. USE THE 'api' HOOK FOR THE REQUEST ---
            const response = await api('/token/', { method: 'POST', data });
            dispatch(setCredentials({ token: response.access, user: response.user }));
            toast.success('Login successful!');
        } catch (err) {
            let errorMessage = 'Login failed. Please check your username and password.';
            if (isAxiosError(err) && err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            toast.error(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-slate-800">Welcome to CalJar</h2>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Username</label>
                        <input
                            {...register('username', { required: 'Username is required' })}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm"
                        />
                        <FormError>{errors.username?.message}</FormError>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            {...register('password', { required: 'Password is required' })}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm"
                        />
                        <FormError>{errors.password?.message}</FormError>
                    </div>
                    <div>
                        <Button type="submit" disabled={isSubmitting} className="w-full flex justify-center">
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}