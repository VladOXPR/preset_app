# Email System Setup Guide

This guide explains how to set up the email system for sending onboarding emails to CUUB hosts.

## Features

- **Professional HTML Email Templates**: Beautiful, responsive email design similar to Mercury's style
- **Admin Panel Integration**: Send onboarding emails directly from the admin panel
- **Customizable Content**: Personalized emails with user-specific information
- **100% Take Home Rate**: Emails highlight the new 100% take-home rate for hosts

## Setup Instructions

### 1. Install Dependencies

The email system uses `nodemailer` for sending emails. Install it by running:

```bash
npm install
```

### 2. Configure Email Credentials

Create a `.env.local` file in your project root with your Gmail credentials:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Gmail Setup

To use Gmail for sending emails, you need to:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS`

### 4. Test the Email System

Run the test script to verify your setup:

```bash
node test-email.js
```

## How to Use

### From Admin Panel

1. **Access Admin Panel**: Go to `/admin` and enter the admin password
2. **Find Host Users**: Look for users with "Host" user type
3. **Send Email**: Click "Send Onboarding Email" button next to any Host user
4. **Enter Email**: Provide the recipient's email address when prompted
5. **Confirm**: The system will send a professional onboarding email

### API Endpoint

You can also send emails programmatically using the API:

```javascript
fetch('/api/send-onboarding-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    username: 'Parlay', 
    email: 'parlay@example.com' 
  })
})
.then(response => response.json())
.then(result => {
  if (result.success) {
    console.log('Email sent successfully!');
  }
});
```

## Email Template Features

The onboarding email includes:

- **Professional Design**: Clean, modern layout with CUUB branding
- **Account Details**: Username, account type, take-home rate, station count
- **Feature Highlights**: Key benefits of the CUUB platform
- **Call-to-Action**: Direct link to login dashboard
- **Next Steps**: Clear instructions for getting started
- **Responsive Design**: Works on desktop and mobile devices

## Example Email Content

The email template includes:

- Welcome message with username
- Account type and take-home rate (100%)
- Number of assigned stations
- Feature list with checkmarks
- Login button
- Next steps guide
- Company footer with social links

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure you're using an App Password, not your regular Gmail password
2. **Email Not Sending**: Check that your Gmail account has 2FA enabled
3. **Template Not Loading**: Ensure the server is running and the endpoint is accessible

### Debug Mode

To see detailed error messages, check the server console logs when sending emails.

## Security Notes

- Email credentials are stored in environment variables
- App passwords are more secure than regular passwords
- The system validates email addresses before sending
- All emails are logged with message IDs for tracking

## Customization

You can customize the email template by modifying the `generateOnboardingEmailHTML` function in `server.js`. The template uses inline CSS for maximum email client compatibility.
