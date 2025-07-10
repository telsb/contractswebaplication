# Aboitiz InfraCapital Contract Management System

A web application to manage and view contracts stored in Google Sheets and Google Drive, with separate access for users and administrators.

## GitHub Pages Deployment

This application is now configured to work with GitHub Pages. Follow these steps to deploy:

### 1. Update Your Apps Script URL

Make sure the `APPS_SCRIPT_URL` in the `index.html` file (around line 25) is set to your deployed Google Apps Script Web App URL:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### 2. Deploy to GitHub Pages

1. **Create a GitHub Repository:**
   - Go to [github.com](https://github.com) and create a new repository
   - Make it **Public**
   - Don't initialize with README (since you already have files)

2. **Upload Files:**
   - Upload the `index.html` file to your repository
   - You can also upload this `README.md` for documentation

3. **Enable GitHub Pages:**
   - Go to your repository Settings
   - Scroll down to "Pages" in the left sidebar
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click Save

4. **Access Your Site:**
   - GitHub will provide a URL like: `https://yourusername.github.io/your-repo-name/`
   - Your app will be live at this URL

## Features

- **User Authentication**: Separate login for users and administrators
- **Estate-based Access**: Users can only view contracts for their assigned estates
- **Admin Dashboard**: Full access to all estates with ability to add locators and contracts
- **Contract Management**: Upload and view PDF contracts with different types (LOI, RA, CTS, DOAS, LTLA, OTHERS)
- **Search Functionality**: Search through locators and contracts
- **Responsive Design**: Works on desktop and mobile devices

## System Requirements

- Google Apps Script backend (already configured)
- Google Sheets for data storage
- Google Drive for file storage
- Modern web browser with JavaScript enabled

## Usage

1. **For Users:**
   - Select your estate from the main page
   - Login with your credentials
   - View and search contracts for your estate
   - Export data to Google Sheets

2. **For Administrators:**
   - Select "ADMIN" from the main page
   - Login with admin credentials
   - View all estates or filter by specific estate
   - Add new locators
   - Upload contracts for any locator
   - Manage the entire system

## Support

If you encounter any issues:
1. Check that your Google Apps Script is deployed and accessible
2. Verify that your Google Sheets has the correct structure
3. Ensure your browser allows third-party cookies and JavaScript
4. Check the browser console for any error messages

The application should now work perfectly on GitHub Pages!