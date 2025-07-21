'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from './auth-client';

interface User {
    id: string;
    email: string;
    username?: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSession = async () => {
        try {
            const session = await authClient.getSession();
            if (session && 'data' in session && session.data?.user) {
                setUser(session.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await authClient.signOut();
            setUser(null);
        } catch (error) {
            console.error('Failed to sign out:', error);
        }
    };

    const refreshSession = async () => {
        await fetchSession();
    };

    useEffect(() => {
        fetchSession();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signOut, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 