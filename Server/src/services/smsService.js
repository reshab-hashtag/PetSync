const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Send SMS
  async sendSMS({ to, message, appointmentId = null }) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      console.log('SMS sent successfully:', result.sid);
      return result;
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Send appointment reminder SMS
  async sendAppointmentReminder(appointment) {
    const client = appointment.client;
    const pet = appointment.pet;
    const business = appointment.business;

    const message = `Hi ${client.fullName}! Reminder: ${pet.profile.name} has an appointment for ${appointment.service.name} tomorrow at ${appointment.schedule.startTime.toLocaleTimeString()}. See you at ${business.profile.name}!`;

    return this.sendSMS({
      to: client.profile.phone,
      message,
      appointmentId: appointment._id
    });
  }
}

module.exports = new SMSService();