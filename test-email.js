#!/usr/bin/env node

const nodemailer = require('nodemailer');

// Email configuration (you'll need to set these in your .env.local file)
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Function to generate onboarding email HTML
function generateOnboardingEmailHTML(username, stationIds, loginUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CUUB - Your Account is Ready</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .description {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 30px;
        }
        .account-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #667eea;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 14px;
        }
        .detail-label {
            font-weight: 600;
            color: #666;
        }
        .detail-value {
            color: #333;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .features {
            margin: 30px 0;
        }
        .feature {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .feature-icon {
            width: 20px;
            height: 20px;
            background-color: #667eea;
            border-radius: 50%;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .footer-text {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 15px;
        }
        .social-links {
            margin-top: 20px;
        }
        .social-link {
            color: white;
            text-decoration: none;
            margin: 0 10px;
            opacity: 0.8;
        }
        .social-link:hover {
            opacity: 1;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CUUB</div>
            <div class="tagline">Smart Battery Solutions</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Welcome to CUUB, ${username}! 🎉</div>
            
            <div class="description">
                Your account has been successfully created and you're now ready to start managing your battery stations. 
                You'll receive 100% of your revenue as take-home earnings.
            </div>
            
            <div class="account-details">
                <div class="detail-row">
                    <span class="detail-label">Username:</span>
                    <span class="detail-value">${username}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Account Type:</span>
                    <span class="detail-value">Host</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Take Home Rate:</span>
                    <span class="detail-value">100%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stations Assigned:</span>
                    <span class="detail-value">${stationIds.length}</span>
                </div>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">✓</div>
                    <span>Real-time station monitoring and revenue tracking</span>
                </div>
                <div class="feature">
                    <div class="feature-icon">✓</div>
                    <span>100% take-home earnings on all revenue</span>
                </div>
                <div class="feature">
                    <div class="feature-icon">✓</div>
                    <span>Mobile-optimized dashboard for on-the-go management</span>
                </div>
                <div class="feature">
                    <div class="feature-icon">✓</div>
                    <span>Automatic payment processing and reporting</span>
                </div>
            </div>
            
            <a href="${loginUrl}" class="cta-button">Access Your Dashboard</a>
            
            <div style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Next Steps:</strong><br>
                1. Click the button above to access your dashboard<br>
                2. Review your assigned stations and current earnings<br>
                3. Set up your payment preferences<br>
                4. Start monitoring your battery stations
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Sent with care from CUUB Technologies
            </div>
            <div class="footer-text">
                333 Bush St, San Francisco, CA 94104
            </div>
            <div class="social-links">
                <a href="#" class="social-link">X</a> •
                <a href="#" class="social-link">LinkedIn</a> •
                <a href="#" class="social-link">Instagram</a> •
                <a href="#" class="social-link">YouTube</a>
            </div>
            <div style="margin-top: 20px; font-size: 12px; opacity: 0.6;">
                "Invisible things alone are the things that shall remain"
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Test function to send onboarding email
async function testOnboardingEmail() {
  try {
    const username = 'Parlay';
    const stationIds = ['BJH09881'];
    const loginUrl = 'http://localhost:3000/login';
    const testEmail = 'test@example.com'; // Change this to your test email
    
    const htmlContent = generateOnboardingEmailHTML(username, stationIds, loginUrl);
    
    const mailOptions = {
      from: `"CUUB Technologies" <${emailConfig.auth.user}>`,
      to: testEmail,
      subject: `Welcome to CUUB, ${username}! Your Account is Ready`,
      html: htmlContent
    };
    
    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    console.log('\n📝 Setup Instructions:');
    console.log('1. Create a .env.local file in your project root');
    console.log('2. Add your Gmail credentials:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-app-password');
    console.log('3. Enable 2-factor authentication on your Gmail account');
    console.log('4. Generate an App Password in Gmail settings');
    console.log('5. Use that App Password as EMAIL_PASS');
  }
}

// Run the test
testOnboardingEmail();
