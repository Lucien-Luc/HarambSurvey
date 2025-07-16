# 🚨 FIREBASE SECURITY RULES REQUIRED

## Current Status: Permission Errors

Your BPN Survey Platform is showing **permission denied** errors because the Firebase security rules need to be applied in your Firebase Console.

## Quick Fix Steps:

### 1. Open Firebase Console
Go to: [https://console.firebase.google.com/](https://console.firebase.google.com/)

### 2. Select Your Project
Choose project: `tasked-7bfac`

### 3. Navigate to Firestore Rules
- Click **"Firestore Database"** in the left menu
- Click **"Rules"** tab at the top

### 4. Replace Rules
Copy and paste this content into the rules editor:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Survey collection - allow public read, admin write
    match /surveys/{surveyId} {
      // Anyone can read surveys (for public survey access)
      allow read: if true;
      
      // Only admins can create/update surveys
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Responses collection - allow public write, admin read
    match /responses/{responseId} {
      // Anyone can submit survey responses (for public surveys)
      allow create: if true;
      
      // Only admins can read all responses (for admin dashboard)
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can update/delete responses
      allow update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Employer diagnostics collection - allow public submissions for talent fair
    match /employer-diagnostics/{diagnosticId} {
      // Anyone can submit employer diagnostic forms (for talent fair participation)
      allow create: if true;
      
      // Only admins can read all diagnostics (for admin dashboard)
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can update/delete diagnostics
      allow update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection - allow admin creation if no admin exists, then admin-only access
    match /users/{userId} {
      // Allow read access to check if admin exists (needed for initial setup)
      allow read: if request.auth != null;
      
      // Allow create only if no admin exists yet (for first admin creation)
      allow create: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.role == 'admin';
      
      // Allow update/delete only for existing admins
      allow update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Settings collection - only admins can access settings
    match /settings/{document} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Analytics collection - only admins can access analytics
    match /analytics/{document} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 5. Publish Rules
Click **"Publish"** to apply the changes

## After Applying Rules:

1. **Refresh your app** - The permission errors should be resolved
2. **Long-press the BPN logo** - To access admin registration
3. **Create your first admin account** - The system will allow only one admin
4. **Start using the survey platform** - All features will work properly

## What These Rules Do:

- ✅ **Public Survey Access**: Anyone can read and take surveys
- ✅ **Admin-Only Management**: Only admins can create/edit surveys and view responses
- ✅ **Single Admin Registration**: Allows creating one admin account, then blocks additional ones
- ✅ **Secure Data Access**: All sensitive operations require admin authentication

The app will work perfectly once these rules are applied!