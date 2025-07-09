const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    // Email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email templates cache
    this.templates = new Map();
  }

  // Load and compile email template
  async loadTemplate(templateName) {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
      
      // Create template if it doesn't exist (for development)
      try {
        await fs.access(templatePath);
      } catch {
        await this.createDefaultTemplate(templateName, templatePath);
      }

      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      
      this.templates.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      // Return a default template
      return handlebars.compile('<p>{{message}}</p>');
    }
  }

  // Create default template for development
  async createDefaultTemplate(templateName, templatePath) {
    const templatesDir = path.dirname(templatePath);
    
    try {
      await fs.mkdir(templatesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const defaultTemplates = {
      'otp-verification': `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{{title}} - PetSync</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                .header { text-align: center; margin-bottom: 20px; }
                .otp-code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; letter-spacing: 4px; color: #2563eb; }
                .warning { background: #fef3cd; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐾 PetSync</h1>
                    <h2>{{title}}</h2>
                </div>
                
                <div class="content">
                    {{#if firstName}}
                        <p>Hi {{firstName}},</p>
                    {{else}}
                        <p>Hello,</p>
                    {{/if}}
                    
                    <p>{{message}}</p>
                    
                    <div class="otp-code">{{otp}}</div>
                    
                    <div class="warning">
                        ⚠️ This code will expire in <strong>10 minutes</strong> and can only be used once.
                    </div>
                    
                    <p><strong>Security Tips:</strong></p>
                    <ul>
                        <li>Never share this code with anyone</li>
                        <li>PetSync will never ask for your code via phone or email</li>
                        <li>If you didn't request this code, please ignore this email</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>This email was sent for {{action}} on your PetSync account.</p>
                    <p>If you have any questions, contact us at support@petsync.com</p>
                    <p>&copy; 2025 PetSync. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      'email-verification': `
        <h2>Welcome to PetSync!</h2>
        <p>Hi {{firstName}},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="{{verificationUrl}}">Verify Email</a>
      `,
      'appointment-confirmation': `
        <h2>Appointment Confirmed</h2>
        <p>Hi {{clientName}},</p>
        <p>Your appointment for {{petName}} has been confirmed:</p>
        <ul>
          <li>Service: {{serviceName}}</li>
          <li>Date: {{date}}</li>
          <li>Time: {{time}}</li>
          <li>Business: {{businessName}}</li>
        </ul>
      `,
      'appointment-reminder': `
        <h2>Appointment Reminder</h2>
        <p>Hi {{clientName}},</p>
        <p>This is a reminder that {{petName}} has an appointment tomorrow:</p>
        <ul>
          <li>Service: {{serviceName}}</li>
          <li>Time: {{time}}</li>
          <li>Location: {{businessName}}</li>
        </ul>
      `
    };

    const template = defaultTemplates[templateName] || '<p>{{message}}</p>';
    await fs.writeFile(templatePath, template);
  }

  // Send email
  async sendEmail({ to, subject, template, data, attachments = [] }) {
    try {
      const emailTemplate = await this.loadTemplate(template);
      const html = emailTemplate(data);

      const mailOptions = {
        from: `"PetSync" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, emailData) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail({
          to: recipient.email,
          subject: emailData.subject,
          template: emailData.template,
          data: { ...emailData.data, recipientName: recipient.name }
        });

        results.push({ recipient: recipient.email, status: 'sent', messageId: result.messageId });
      } catch (error) {
        results.push({ recipient: recipient.email, status: 'failed', error: error.message });
      }
    }

    return results;
  }
}

// Export a single instance
const emailService = new EmailService();

// Export the sendEmail function directly for backward compatibility
const sendEmail = emailService.sendEmail.bind(emailService);

module.exports = {
  sendEmail,
  emailService
};