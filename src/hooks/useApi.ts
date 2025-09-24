// In src/hooks/useApi.ts

import { useCallback } from 'react';
import axios, { isAxiosError, type AxiosRequestConfig } from 'axios';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logOut } from '../store/authSlice';
import { type RootState } from '../store/store';
import toast from 'react-hot-toast';

export function useApi() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state: RootState) => state.auth.token);

    const api = useCallback(async (endpoint: string, config: AxiosRequestConfig = {}) => {
        
        // --- THIS IS THE FIX ---
        // This ensures the API path is correctly constructed for both development and production.
        const requestUrl = `/api${endpoint}`;
        
        const instance = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || '', // Base URL is just the domain
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...config.headers,
            },
        });

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (isAxiosError(error) && error.response) {
                    const { status, data } = error.response;
                    if (status === 401) {
                        dispatch(logOut());
                        toast.error("Your session has expired. Please log in again.");
                    } else if (status === 403) {
                        toast.error(data.detail || "You do not have permission to perform this action.");
                    } else if (status === 400) {
                        if (typeof data === 'object' && data !== null) {
                            const errorMessages = Object.values(data).flat().join(' ');
                            if (errorMessages) {
                                toast.error(`Error: ${errorMessages}`);
                            }
                        }
                    }
                }
                return Promise.reject(error);
            }
        );

        try {
            const response = await instance({
                // Use the correctly constructed URL
                url: requestUrl,
                ...config,
            });
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                throw error.response || error;
            }
            throw error;
        }

    }, [token, dispatch]);

    return api;
}