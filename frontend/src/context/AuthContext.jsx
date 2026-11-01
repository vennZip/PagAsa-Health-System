import { createContext, useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

import { auth } from "../firebase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Retrieve the user's MongoDB profile
  const fetchUserProfile = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken();

    const response = await fetch(
      "http://localhost:5000/api/users/me",
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
      "http://localhost:5000/api/users/register",
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

    return data;
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
        "http://localhost:5000/api/users/register",
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

  // Monitor Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
