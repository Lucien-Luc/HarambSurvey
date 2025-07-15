# BPN Survey Platform - Admin Setup Guide

## Creating the Admin Account

Your survey platform is configured to allow only **ONE** admin account with the email: `admin@bpn.com`

### Step 1: Enable Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `tasked-7bfac`
3. Click **"Authentication"** in the left menu
4. Click **"Get started"** if not already enabled
5. Go to the **"Sign-in method"** tab
6. Click **"Email/Password"** and enable it
7. Click **"Save"**

### Step 2: Create the Admin User
1. In Firebase Authentication, go to the **"Users"** tab
2. Click **"Add user"**
3. Enter:
   - **Email**: `admin@bpn.com`
   - **Password**: Choose a strong password (remember this!)
4. Click **"Add user"**

### Step 3: Access the Admin Panel

**How to access admin:**
1. Go to your survey app: `http://localhost:5000`
2. **Press and hold the BPN logo for 5 seconds** (long press)
3. The admin login form will appear
4. Sign in with:
   - Email: `admin@bpn.com`
   - Password: (the password you set in Step 2)

## Admin Panel Features

Once logged in, you'll have access to:

- **Dashboard**: Overview of surveys and responses
- **Surveys**: Manage existing surveys
- **Form Builder**: Create new surveys with drag-and-drop
- **Responses**: View and export survey responses
- **Analytics**: Charts and insights from survey data

## Security Features

✅ **Single Admin Account**: Only `admin@bpn.com` can access the system
✅ **Secure Authentication**: Firebase handles password security
✅ **Hidden Access**: Admin panel only accessible via 5-second logo press
✅ **Auto Logout**: Session expires for security

## Need Help?

If you can't sign in:
1. Check that you created the user with exactly `admin@bpn.com`
2. Verify Firebase Authentication is enabled
3. Make sure you're holding the logo for the full 5 seconds
4. Check browser console for any error messages