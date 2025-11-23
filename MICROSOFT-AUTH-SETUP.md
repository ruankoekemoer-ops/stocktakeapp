# Microsoft Authentication Setup Guide

## How Microsoft Authentication Works

Microsoft authentication uses **OAuth 2.0** and **OpenID Connect** protocols:

1. **User clicks "Sign in with Microsoft"**
2. **App redirects to Microsoft login page** (login.microsoftonline.com)
3. **User enters credentials** (or is already logged in)
4. **Microsoft redirects back** with an authorization code
5. **App exchanges code for tokens** (access token, ID token)
6. **App uses tokens** to access Microsoft APIs and identify the user

## Prerequisites

You need to register your app in **Azure Portal**:

1. Go to https://portal.azure.com
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Click **App registrations** → **New registration**
4. Fill in:
   - **Name**: Stock Take App (or your choice)
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: 
     - Type: **Single-page application (SPA)**
     - URI: `https://stock-take-api.rkoekemoer.workers.dev` (or your app URL)
5. Click **Register**
6. Copy the **Application (client) ID** - you'll need this
7. Go to **Authentication** → Add redirect URI for localhost: `http://localhost:8080`
8. Go to **API permissions** → Add permission → Microsoft Graph → Delegated permissions:
   - `User.Read` (to get user profile)
   - `email` (to get user email)
   - `profile` (to get user profile info)
9. Click **Grant admin consent** (if you're an admin)

## Configuration

After registration, you'll get:
- **Client ID** (Application ID)
- **Tenant ID** (Directory ID) - Optional, can use "common" for multi-tenant

## Security Notes

- **Client ID is public** - safe to include in frontend code
- **Never expose secrets** - MSAL.js uses public client flow (no client secret needed)
- **Tokens are stored securely** in browser session storage
- **HTTPS required** for production (Cloudflare provides this)

