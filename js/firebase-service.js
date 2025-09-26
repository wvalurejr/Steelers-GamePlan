// Firebase Service Module for Steelers GamePlan
// Handles all Firebase operations for persistent, collaborative features

class FirebaseService {
    constructor() {
        if (FirebaseService.instance) {
            return FirebaseService.instance;
        }

        this.app = null;
        this.db = null;
        this.initialized = false;
        this.listeners = new Map();

        FirebaseService.instance = this;
        return this;
    }

    static getInstance() {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    async initialize() {
        try {
            // Check if we're on a proper web server
            if (location.protocol === 'file:') {
                throw new Error('Firebase not supported on file:// protocol - use a web server');
            }

            // Check if Firebase is available
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            // Firebase configuration - Replace with your actual Firebase project config
            const firebaseConfig = {
                apiKey: "AIzaSyC7xQqQrJqX9g_YLOoqYxs-VdJzHXsVxWg",
                authDomain: "steelers-gameplan.firebaseapp.com",
                projectId: "steelers-gameplan",
                storageBucket: "steelers-gameplan.firebasestorage.app",
                messagingSenderId: "123456789012",
                appId: "1:123456789012:web:abc123def456ghi789jkl"
            };

            // For localhost development, you can also use Firebase emulator
            // Uncomment the lines below if you want to use Firebase emulator:
            // if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            //     this.db.useEmulator('localhost', 8080);
            // }

            // Initialize Firebase
            this.app = firebase.initializeApp(firebaseConfig);

            // Initialize Firestore with modern cache settings for offline persistence
            this.db = firebase.firestore();

            // Configure for localhost development
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.log('Running on localhost - configuring Firebase for local development');

                // Add any localhost-specific configuration here
                // For example, you might want to use different settings or emulator
                this.db.useEmulator('localhost', 8080); // Uncomment if using emulator
            }

            // Use modern cache settings instead of deprecated enablePersistence
            try {
                const settings = {
                    cache: firebase.firestore.MemoryLocalCache.getInstance()
                };
                this.db.settings(settings);
                console.log('Firebase offline persistence enabled with modern cache settings');
            } catch (err) {
                console.warn('Firebase cache settings failed, falling back to default:', err);
                // Fallback to basic settings if cache configuration fails
                this.db.settings({});
            }

            this.initialized = true;
            console.log('Firebase initialized successfully');
            return true;

        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.initialized = false;
            throw error;
        }
    }

    isInitialized() {
        return this.initialized;
    }

    // Plays Management
    async savePlay(play) {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const playRef = this.db.collection('plays').doc(play.id);
            await playRef.set({
                ...play,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Log activity
            await this.logActivity('play_saved', `Play "${play.name}" saved`, { playId: play.id });

            return true;
        } catch (error) {
            console.error('Error saving play:', error);
            throw error;
        }
    }

    async getPlays() {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const snapshot = await this.db.collection('plays')
                .orderBy('created', 'desc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting plays:', error);
            throw error;
        }
    }

    async deletePlay(playId) {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            await this.db.collection('plays').doc(playId).delete();
            await this.logActivity('play_deleted', `Play deleted`, { playId });
            return true;
        } catch (error) {
            console.error('Error deleting play:', error);
            throw error;
        }
    }

    // Real-time listeners
    onPlaysChange(callback) {
        if (!this.initialized) return null;

        try {
            const unsubscribe = this.db.collection('plays')
                .orderBy('created', 'desc')
                .onSnapshot(snapshot => {
                    const plays = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback(plays);
                });

            this.listeners.set('plays', unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up plays listener:', error);
            return null;
        }
    }

    // Custom Lineups Management
    async saveCustomLineup(lineup) {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const lineupRef = this.db.collection('customLineups').doc(lineup.name);
            await lineupRef.set({
                ...lineup,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.logActivity('lineup_saved', `Custom lineup "${lineup.name}" saved`, { lineupName: lineup.name });
            return true;
        } catch (error) {
            console.error('Error saving custom lineup:', error);
            throw error;
        }
    }

    async getCustomLineups() {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const snapshot = await this.db.collection('customLineups')
                .orderBy('created', 'desc')
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting custom lineups:', error);
            throw error;
        }
    }

    async deleteCustomLineup(lineupName) {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            await this.db.collection('customLineups').doc(lineupName).delete();
            await this.logActivity('lineup_deleted', `Custom lineup "${lineupName}" deleted`, { lineupName });
            return true;
        } catch (error) {
            console.error('Error deleting custom lineup:', error);
            throw error;
        }
    }

    // Settings Management
    async saveSettings(settings) {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const settingsRef = this.db.collection('settings').doc('teamSettings');
            await settingsRef.set({
                ...settings,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    async getSettings() {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const doc = await this.db.collection('settings').doc('teamSettings').get();
            return doc.exists ? doc.data() : {};
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    // Activity Logging
    async logActivity(action, description, metadata = {}) {
        if (!this.initialized) return;

        try {
            await this.db.collection('activity').add({
                action,
                description,
                metadata,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    async getRecentActivity(limitCount = 50) {
        if (!this.initialized) throw new Error('Firebase not initialized');

        try {
            const snapshot = await this.db.collection('activity')
                .orderBy('timestamp', 'desc')
                .limit(limitCount)
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        }
    }

    // Admin Data Methods
    async getTeams() {
        try {
            const doc = await this.db.collection('admin').doc('teams').get();
            return doc.exists ? doc.data().teams || [] : [];
        } catch (error) {
            console.error('Error getting teams:', error);
            throw error;
        }
    }

    async saveTeams(teams) {
        try {
            await this.db.collection('admin').doc('teams').set({
                teams: teams,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving teams:', error);
            throw error;
        }
    }

    async getSchedule() {
        try {
            const doc = await this.db.collection('admin').doc('schedule').get();
            return doc.exists ? doc.data().games || [] : [];
        } catch (error) {
            console.error('Error getting schedule:', error);
            throw error;
        }
    }

    async saveSchedule(games) {
        try {
            await this.db.collection('admin').doc('schedule').set({
                games: games,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving schedule:', error);
            throw error;
        }
    }

    async getPlayers() {
        try {
            const doc = await this.db.collection('admin').doc('players').get();
            return doc.exists ? doc.data().players || [] : [];
        } catch (error) {
            console.error('Error getting players:', error);
            throw error;
        }
    }

    async savePlayers(players) {
        try {
            await this.db.collection('admin').doc('players').set({
                players: players,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving players:', error);
            throw error;
        }
    }

    async getSeasonData() {
        try {
            const doc = await this.db.collection('admin').doc('season').get();
            return doc.exists ? doc.data() : {};
        } catch (error) {
            console.error('Error getting season data:', error);
            throw error;
        }
    }

    async saveSeasonData(seasonData) {
        try {
            await this.db.collection('admin').doc('season').set({
                ...seasonData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving season data:', error);
            throw error;
        }
    }

    async getContentData() {
        try {
            const doc = await this.db.collection('admin').doc('content').get();
            return doc.exists ? doc.data() : {};
        } catch (error) {
            console.error('Error getting content data:', error);
            throw error;
        }
    }

    async saveContentData(contentData) {
        try {
            await this.db.collection('admin').doc('content').set({
                ...contentData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving content data:', error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const doc = await this.db.collection('admin').doc('settings').get();
            return doc.exists ? doc.data() : {};
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    async saveSettings(settings) {
        try {
            await this.db.collection('admin').doc('settings').set({
                ...settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    async getArchivedSeasons() {
        try {
            const doc = await this.db.collection('admin').doc('archives').get();
            return doc.exists ? doc.data().seasons || [] : [];
        } catch (error) {
            console.error('Error getting archived seasons:', error);
            throw error;
        }
    }

    async saveArchivedSeasons(seasons) {
        try {
            await this.db.collection('admin').doc('archives').set({
                seasons: seasons,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving archived seasons:', error);
            throw error;
        }
    }

    // Utility Methods
    cleanup() {
        // Unsubscribe from all listeners
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }

    isOnline() {
        return navigator.onLine;
    }
}