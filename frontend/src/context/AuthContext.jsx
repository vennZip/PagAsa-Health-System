import { apiUrl } from "../config/api";
import { createContext, useEffect, useRef, useState } from "react";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail
} from "firebase/auth";

import { auth } from "../firebase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const registrationInProgress = useRef(false);

  // Retrieve the user's MongoDB profile
  const fetchUserProfile = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken();

    const response = await fetch(
      apiUrl("/api/users/me"),
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to retrieve user profile."
      );
    }

    setUserProfile(data.data);

    return data.data;
  };

  // Register a new patient account
  const register = async (fullName, email, password) => {
    registrationInProgress.current = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: fullName
      });

      const token = await firebaseUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/users/register"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ fullName })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Profile registration failed."
        );
      }

      await fetchUserProfile(firebaseUser);
      setCurrentUser(firebaseUser);

      return data;
    } catch (error) {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      throw error;
    } finally {
      registrationInProgress.current = false;
    }
  };

  // Login an existing account
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/users/register"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: firebaseUser.displayName || "Patient"
          })
        }
      );

      const data = await response.json();

      if (!response.ok && response.status !== 409) {
        throw new Error(
          data.message || "Profile synchronization failed."
        );
      }

      // Retrieve the actual MongoDB role and account status
      await fetchUserProfile(firebaseUser);

      return firebaseUser;

    } catch (error) {
      // Sign out if the backend rejects the account
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);

      throw error;
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changeEmail = async (newEmail, password) => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser?.email) {
      throw new Error("No authenticated email account was found.");
    }

    const credential = EmailAuthProvider.credential(
      firebaseUser.email,
      password
    );

    await reauthenticateWithCredential(firebaseUser, credential);
    await verifyBeforeUpdateEmail(
      firebaseUser,
      newEmail.trim().toLowerCase()
    );
  };

  const changePassword = async (currentPassword, newPassword) => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser?.email) {
      throw new Error("No authenticated email account was found.");
    }

    const credential = EmailAuthProvider.credential(
      firebaseUser.email,
      currentPassword
    );

    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  };

  // Monitor Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        // Firebase signs in a newly created account before its backend
        // profile exists. Registration completes that synchronization.
        if (user && registrationInProgress.current) {
          return;
        }

        setUserProfile(null);

        if (!user) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        try {
          await fetchUserProfile(user);
          setCurrentUser(user);

        } catch (error) {
          console.error(
            "Unable to retrieve user profile:",
            error
          );

          // Reject accounts without a valid backend profile
          setCurrentUser(null);
          setUserProfile(null);

          await signOut(auth);

        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || null,
    register,
    login,
    resetPassword,
    changeEmail,
    changePassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
