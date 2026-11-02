import { apiUrl } from "../config/api";
import { createContext, useCallback, useEffect, useRef, useState } from "react";

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

// Context and provider intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasPatientProfile, setHasPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const registrationInProgress = useRef(false);

  // Retrieve the user's MongoDB profile
  const fetchPatientProfileStatus = useCallback(async (firebaseUser, profile) => {
    if (profile?.role !== "patient") {
      setHasPatientProfile(true);
      return true;
    }

    const token = await firebaseUser.getIdToken();
    const response = await fetch(apiUrl("/api/patients/me"), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 404) {
      setHasPatientProfile(false);
      return false;
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to check your patient profile.");
    }

    setHasPatientProfile(true);
    return true;
  }, []);

  const fetchUserProfile = useCallback(async (firebaseUser) => {
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
    await fetchPatientProfileStatus(firebaseUser, data.data);

    return data.data;
  }, [fetchPatientProfileStatus]);

  const activateSession = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken();
    const response = await fetch(apiUrl("/api/users/session"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to activate your session.");
    }
  };

  // Register a new patient account
  const register = async (fullName, email, password, privacyConsent) => {
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
          body: JSON.stringify({ fullName, privacyConsent })
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
      setHasPatientProfile(null);
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

      await activateSession(firebaseUser);

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
    setHasPatientProfile(null);
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
        setHasPatientProfile(null);

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
          setHasPatientProfile(null);

          await signOut(auth);

        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [fetchUserProfile]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const verifySession = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(apiUrl("/api/users/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
          sessionStorage.setItem(
            "pagasa_logout_notice",
            "This account was signed in somewhere else, so this session was logged out."
          );
          await logout();
        }
      } catch (error) {
        console.error("Session verification failed:", error);
      }
    };

    const interval = window.setInterval(verifySession, 15000);
    return () => window.clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    hasPatientProfile,
    role: userProfile?.role || null,
    register,
    login,
    resetPassword,
    changeEmail,
    changePassword,
    refreshPatientProfileStatus: () => fetchPatientProfileStatus(auth.currentUser, userProfile),
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
