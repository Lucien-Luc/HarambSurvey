// Firebase Initialization Script
// Run this in the browser console to set up sample data

async function initializeFirebaseData() {
    if (!window.firebaseConfig || !window.firebaseConfig.db) {
        console.error('Firebase not initialized');
        return;
    }

    const db = window.firebaseConfig.db;

    try {
        // Create sample survey
        const sampleSurvey = {
            id: 'customer-satisfaction-2025',
            title: 'Customer Satisfaction Survey',
            description: 'Help us improve our services by sharing your feedback',
            status: 'active',
            questions: [
                {
                    id: 'q1',
                    type: 'radio',
                    title: 'How satisfied are you with our service?',
                    description: 'Please rate your overall satisfaction',
                    required: true,
                    options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                },
                {
                    id: 'q2',
                    type: 'checkbox',
                    title: 'Which features do you use most?',
                    description: 'Select all that apply',
                    required: false,
                    options: ['Mobile App', 'Website', 'Customer Support', 'Email Notifications', 'Reports']
                },
                {
                    id: 'q3',
                    type: 'rating',
                    title: 'Rate our customer support',
                    description: 'On a scale of 1-5 stars',
                    required: true,
                    scale: 5
                },
                {
                    id: 'q4',
                    type: 'text',
                    title: 'Any additional comments?',
                    description: 'Please share any suggestions or feedback',
                    required: false
                }
            ],
            createdAt: firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now(),
            responseCount: 0
        };

        // Add survey to Firestore
        await db.collection('surveys').doc(sampleSurvey.id).set(sampleSurvey);
        console.log('Sample survey created successfully');

        // Create sample responses
        const sampleResponses = [
            {
                surveyId: 'customer-satisfaction-2025',
                responses: {
                    q1: 'Very Satisfied',
                    q2: ['Mobile App', 'Website'],
                    q3: 5,
                    q4: 'Great service, keep it up!'
                },
                submittedAt: firebase.firestore.Timestamp.now(),
                device: 'mobile',
                status: 'completed'
            },
            {
                surveyId: 'customer-satisfaction-2025',
                responses: {
                    q1: 'Satisfied',
                    q2: ['Website', 'Customer Support'],
                    q3: 4,
                    q4: 'Good overall experience'
                },
                submittedAt: firebase.firestore.Timestamp.now(),
                device: 'desktop',
                status: 'completed'
            }
        ];

        // Add responses to Firestore
        for (const response of sampleResponses) {
            await db.collection('responses').add(response);
        }
        console.log('Sample responses created successfully');

        // Reload the page to see the changes
        window.location.reload();

    } catch (error) {
        console.error('Error initializing Firebase data:', error);
    }
}

// Instructions for the user
console.log(`
To initialize sample data in Firebase:
1. Make sure your Firestore rules allow read/write access
2. Run: initializeFirebaseData()
3. The page will refresh automatically with sample data
`);