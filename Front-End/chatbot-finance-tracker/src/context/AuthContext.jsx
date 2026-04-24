import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../services/firebase';
import { signInWithGoogle, logoutUser } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);
            const { backendUser } = await signInWithGoogle();
            // You can optionally store backend token or user data in state/localStorage here
            console.log("Logged in successfully via Backend!", backendUser);
            return backendUser;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const value = {
        currentUser,
        loginWithGoogle,
        logout,
        error,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
