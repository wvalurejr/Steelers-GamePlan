// Firebase Service Module for Steelers GamePlan
// Handles all Firebase operations for persistent, collaborative features

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.isInitialized = false;
        this.listeners = new Map(); // Store active listeners for cleanup
    }

    // Initialize Firebase
    async initialize() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyBYElCAAxCwsJ2w_baL6bu_6Bq8CzVKY-M",
                authDomain: "steelers-app.firebaseapp.com",
                projectId: "steelers-app",
                storageBucket: "steelers-app.firebasestorage.app",
                messagingSenderId: "13648088121",
                appId: "1:13648088121:web:495f8e5df5bf8c7a0f91e8"
            };

            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.isInitialized = true;
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    // Check if Firebase is ready
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
    }

    // =================== PLAYS MANAGEMENT ===================
    
    // Save a play to Firebase
    async savePlay(playData) {
        this.ensureInitialized();
        try {
            const playId = playData.id || `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const playDoc = {
                id: playId,
                name: playData.name || 'Untitled Play',
                elements: playData.elements || [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: playData.createdBy || 'Anonymous',
                category: playData.category || 'general',
                description: playData.description || ''
            };

            await setDoc(doc(this.db, 'plays', playId), playDoc);
            console.log('Play saved successfully:', playId);
            return playId;
        } catch (error) {
            console.error('Error saving play:', error);
            throw error;
        }
    }

    // Load a specific play
    async loadPlay(playId) {
        this.ensureInitialized();
        try {
            const playDoc = await getDoc(doc(this.db, 'plays', playId));
            if (playDoc.exists()) {
                return { id: playDoc.id, ...playDoc.data() };
            } else {
                console.warn('Play not found:', playId);
                return null;
            }
        } catch (error) {
            console.error('Error loading play:', error);
            throw error;
        }
    }

    // Load all plays
    async loadAllPlays() {
        this.ensureInitialized();
        try {
            const playsQuery = query(
                collection(this.db, 'plays'),
                orderBy('updatedAt', 'desc')
            );
            const querySnapshot = await getDocs(playsQuery);
            const plays = [];
            
            querySnapshot.forEach((doc) => {
                plays.push({ id: doc.id, ...doc.data() });
            });
            
            return plays;
        } catch (error) {
            console.error('Error loading plays:', error);
            throw error;
        }
    }

    // Delete a play
    async deletePlay(playId) {
        this.ensureInitialized();
        try {
            await deleteDoc(doc(this.db, 'plays', playId));
            console.log('Play deleted successfully:', playId);
        } catch (error) {
            console.error('Error deleting play:', error);
            throw error;
        }
    }

    // Listen to plays changes in real-time
    onPlaysChanged(callback) {
        this.ensureInitialized();
        try {
            const playsQuery = query(
                collection(this.db, 'plays'),
                orderBy('updatedAt', 'desc')
            );
            
            const unsubscribe = onSnapshot(playsQuery, (snapshot) => {
                const plays = [];
                snapshot.forEach((doc) => {
                    plays.push({ id: doc.id, ...doc.data() });
                });
                callback(plays);
            });

            // Store listener for cleanup
            this.listeners.set('plays', unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up plays listener:', error);
            throw error;
        }
    }

    // =================== CUSTOM LINEUPS MANAGEMENT ===================
    
    // Save custom lineup
    async saveCustomLineup(lineupData) {
        this.ensureInitialized();
        try {
            const lineupId = lineupData.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const lineupDoc = {
                id: lineupId,
                name: lineupData.name,
                positions: lineupData.positions || [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: lineupData.createdBy || 'Anonymous',
                isPublic: lineupData.isPublic !== false // Default to public
            };

            await setDoc(doc(this.db, 'lineups', lineupId), lineupDoc);
            console.log('Custom lineup saved successfully:', lineupId);
            return lineupId;
        } catch (error) {
            console.error('Error saving custom lineup:', error);
            throw error;
        }
    }

    // Load custom lineups
    async loadCustomLineups() {
        this.ensureInitialized();
        try {
            const lineupsQuery = query(
                collection(this.db, 'lineups'),
                orderBy('updatedAt', 'desc')
            );
            const querySnapshot = await getDocs(lineupsQuery);
            const lineups = {};
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                lineups[data.name] = data;
            });
            
            return lineups;
        } catch (error) {
            console.error('Error loading custom lineups:', error);
            throw error;
        }
    }

    // =================== TEAM SETTINGS MANAGEMENT ===================
    
    // Save team settings
    async saveTeamSettings(settings) {
        this.ensureInitialized();
        try {
            const settingsDoc = {
                ...settings,
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(this.db, 'settings', 'team'), settingsDoc);
            console.log('Team settings saved successfully');
        } catch (error) {
            console.error('Error saving team settings:', error);
            throw error;
        }
    }

    // Load team settings
    async loadTeamSettings() {
        this.ensureInitialized();
        try {
            const settingsDoc = await getDoc(doc(this.db, 'settings', 'team'));
            if (settingsDoc.exists()) {
                return settingsDoc.data();
            } else {
                // Return default settings if none exist
                return {
                    theme: 'dark',
                    autoSave: true,
                    showCoordinates: true,
                    snapToGrid: true,
                    defaultActionMode: 'move'
                };
            }
        } catch (error) {
            console.error('Error loading team settings:', error);
            throw error;
        }
    }

    // =================== ACTIVITY LOG ===================
    
    // Log user activity
    async logActivity(action, details = {}) {
        this.ensureInitialized();
        try {
            const activityDoc = {
                action,
                details,
                timestamp: serverTimestamp(),
                user: details.user || 'Anonymous'
            };

            await addDoc(collection(this.db, 'activity'), activityDoc);
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw error for activity logging to avoid disrupting main functionality
        }
    }

    // Get recent activity
    async getRecentActivity(limitCount = 50) {
        this.ensureInitialized();
        try {
            const activityQuery = query(
                collection(this.db, 'activity'),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(activityQuery);
            const activities = [];
            
            querySnapshot.forEach((doc) => {
                activities.push({ id: doc.id, ...doc.data() });
            });
            
            return activities;
        } catch (error) {
            console.error('Error loading recent activity:', error);
            throw error;
        }
    }

    // =================== UTILITY METHODS ===================
    
    // Clean up all listeners
    cleanup() {
        this.listeners.forEach((unsubscribe, key) => {
            unsubscribe();
            console.log(`Cleaned up listener: ${key}`);
        });
        this.listeners.clear();
    }

    // Check if online/offline
    isOnline() {
        return navigator.onLine && this.isInitialized;
    }

    // Get server timestamp
    getServerTimestamp() {
        return serverTimestamp();
    }
}

// Create singleton instance
const firebaseService = new FirebaseService();

// Initialize Firebase when module loads
firebaseService.initialize().then(success => {
    if (success) {
        console.log('🔥 Firebase Service ready for Steelers GamePlan!');
        // Dispatch custom event to notify app that Firebase is ready
        window.dispatchEvent(new CustomEvent('firebaseReady'));
    } else {
        console.warn('⚠️ Firebase Service failed to initialize. App will work in offline mode.');
        window.dispatchEvent(new CustomEvent('firebaseError'));
    }
});

export default firebaseService;