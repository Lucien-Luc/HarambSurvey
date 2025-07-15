// Firebase Configuration
class FirebaseConfig {
    constructor() {
        this.config = {
            apiKey: this.getEnvVar('FIREBASE_API_KEY'),
            authDomain: `${this.getEnvVar('FIREBASE_PROJECT_ID')}.firebaseapp.com`,
            projectId: this.getEnvVar('FIREBASE_PROJECT_ID'),
            storageBucket: `${this.getEnvVar('FIREBASE_PROJECT_ID')}.firebasestorage.app`,
            messagingSenderId: this.getEnvVar('FIREBASE_MESSAGING_SENDER_ID', ''),
            appId: this.getEnvVar('FIREBASE_APP_ID')
        };
        
        this.app = null;
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        
        this.init();
    }
    
    getEnvVar(name, fallback = null) {
        // Try to get from environment variables (if available)
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name] || fallback;
        }
        
        // Try to get from window object (for development)
        if (typeof window !== 'undefined' && window.ENV) {
            return window.ENV[name] || fallback;
        }
        
        // Fallback values for development
        const fallbacks = {
            'FIREBASE_API_KEY': 'AIzaSyA51uZoEjokzLMN8738uhxl_eHvVjKTBSA',
            'FIREBASE_PROJECT_ID': 'tasked-7bfac',
            'FIREBASE_APP_ID': '1:834333377475:web:b343415fc6ebc54512f376'
        };
        
        return fallbacks[name] || fallback;
    }
    
    init() {
        try {
            // Initialize Firebase
            this.app = firebase.initializeApp(this.config);
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.onAuthStateChanged(user);
            });
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showConfigError();
        }
    }
    
    onAuthStateChanged(user) {
        // This will be overridden by the main app
        if (window.app && window.app.handleAuthStateChange) {
            window.app.handleAuthStateChange(user);
        }
    }
    
    showConfigError() {
        const errorHtml = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                        max-width: 500px; text-align: center; z-index: 9999;">
                <h3 style="color: #EF4444; margin-bottom: 1rem;">Firebase Configuration Required</h3>
                <p style="margin-bottom: 1rem;">Please configure your Firebase credentials:</p>
                <ol style="text-align: left; margin-bottom: 1rem;">
                    <li>Go to <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a></li>
                    <li>Create a new project or select existing</li>
                    <li>Enable Authentication and Firestore</li>
                    <li>Get your config values from Project Settings</li>
                    <li>Set environment variables or update firebase-config.js</li>
                </ol>
                <button onclick="this.parentElement.remove()" 
                        style="background: #2DD4BF; color: white; border: none; padding: 0.5rem 1rem; 
                               border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.5); z-index: 9998;"></div>
        `;
        
        const errorElement = document.createElement('div');
        errorElement.innerHTML = errorHtml;
        document.body.appendChild(errorElement);
    }
    
    // Auth methods
    async signInWithEmailAndPassword(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            
            // Check if this is the authorized admin
            const adminEmail = 'admin@bpn.com'; // Single admin email
            if (result.user.email !== adminEmail) {
                await this.auth.signOut();
                return { success: false, error: 'Unauthorized access. Only the designated admin can access this system.' };
            }
            
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign in error:', error);
            
            // Provide user-friendly error messages
            let errorMessage = error.message;
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No admin account found with this email address.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            
            return { success: false, error: errorMessage };
        }
    }
    
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Firestore methods
    async createDocument(collection, data, docId = null) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const docData = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp
            };
            
            let docRef;
            if (docId) {
                docRef = this.db.collection(collection).doc(docId);
                await docRef.set(docData);
            } else {
                docRef = await this.db.collection(collection).add(docData);
            }
            
            return { success: true, id: docRef.id, data: docData };
        } catch (error) {
            console.error('Error creating document:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateDocument(collection, docId, data) {
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const updateData = {
                ...data,
                updatedAt: timestamp
            };
            
            await this.db.collection(collection).doc(docId).update(updateData);
            return { success: true };
        } catch (error) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getDocument(collection, docId) {
        try {
            const doc = await this.db.collection(collection).doc(docId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error('Error getting document:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getCollection(collection, orderBy = null, limit = null) {
        try {
            let query = this.db.collection(collection);
            
            if (orderBy) {
                query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: docs };
        } catch (error) {
            console.error('Error getting collection:', error);
            return { success: false, error: error.message };
        }
    }
    
    async deleteDocument(collection, docId) {
        try {
            await this.db.collection(collection).doc(docId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Real-time listeners
    listenToCollection(collection, callback, orderBy = null) {
        let query = this.db.collection(collection);
        
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
        }
        
        return query.onSnapshot((snapshot) => {
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            callback(docs);
        }, (error) => {
            console.error('Error listening to collection:', error);
            callback(null, error);
        });
    }
    
    listenToDocument(collection, docId, callback) {
        return this.db.collection(collection).doc(docId).onSnapshot((doc) => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() });
            } else {
                callback(null, 'Document not found');
            }
        }, (error) => {
            console.error('Error listening to document:', error);
            callback(null, error);
        });
    }
}

// Create global Firebase instance
window.firebaseConfig = new FirebaseConfig();
