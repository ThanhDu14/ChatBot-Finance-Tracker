import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const signInWithGoogle = async () => {
    try {
        // 1. Sign in with Google using Firebase
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // 2. Get the ID token from Firebase
        const idToken = await user.getIdToken();

        // 3. Send the ID token to the FastAPI backend for verification
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: idToken })
        });

        if (!response.ok) {
            throw new Error(`Backend authentication failed: ${response.statusText}`);
        }

        const backendData = await response.json();

        // Return combined user info
        return {
            firebaseUser: user,
            backendUser: backendData
        };
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        // 1. Tell backend to logout (clear cookies/sessions if any)
        try {
            await fetch(`${BACKEND_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (backendError) {
            console.warn("Backend logout failed, proceeding with Firebase logout:", backendError);
        }

        // 2. Sign out from Firebase
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};
