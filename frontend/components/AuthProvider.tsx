'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

interface User {
    id: string;
    email: string;
    full_name?: string;
}

interface UserProfile {
    id: string;
    tier: string;
    credits: number;
    builds_count: number;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const token = apiClient.getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // simple health check/self check
                const data = await apiClient.getMe();
                // If health check passes, token is at least valid for verification
                // In a more complex app, we'd have a /users/me endpoint
                // For now, let's assume if they have a token, we can use it
                // We'll decode the token locally to get user info if possible
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.sub, email: '' }); // Email and name would ideally come from /me
            } catch (error) {
                console.error('Session check failed:', error);
                apiClient.clearToken();
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const signOut = async () => {
        apiClient.clearToken();
        setUser(null);
        setProfile(null);
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
