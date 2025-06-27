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

module.exports = new EmailService();