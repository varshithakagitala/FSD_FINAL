import nodemailer, { Transporter } from 'nodemailer';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;
  private configError: string | null = null;
  private initialized = false;

  constructor() {
    // Lazy init — credentials are read on first use after dotenv is fully loaded
  }

  private ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
      this.initTransporter();
    }
  }

  private initTransporter() {
    let host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    if (host.includes('@') || !host) {
      host = 'smtp.gmail.com';
    }
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = (process.env.SMTP_USER || '').trim();
    const rawPass = (process.env.SMTP_PASS || '').trim();
    // Gmail 16-character app passwords are often copied with spaces (e.g. "abcd efgh ijkl mnop")
    const pass = rawPass.replace(/\s+/g, '');

    // Verify presence of non-placeholder credentials
    if (!user || !pass || user.includes('your_email') || pass.includes('your_gmail')) {
      this.isConfigured = false;
      this.configError = 'Gmail SMTP credentials are unconfigured. Please provide valid SMTP_USER and SMTP_PASS in your environment.';
      console.warn('[RescueGrid SMTP Warning]: ' + this.configError);
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      this.isConfigured = true;
      this.configError = null;
      console.log(`[RescueGrid SMTP] Configured Nodemailer transport for ${host}:${port} with user: ${user}`);
    } catch (err: any) {
      this.isConfigured = false;
      this.configError = err.message || 'Failed to initialize Nodemailer transport';
      console.error('[RescueGrid SMTP Init Error]:', err);
    }
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    this.ensureInitialized();
    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        message: this.configError || 'SMTP_USER and SMTP_PASS are not configured in environment variables.',
      };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP server is ready to deliver real emails.' };
    } catch (err: any) {
      return { success: false, message: `SMTP connection verification failed: ${err.message}` };
    }
  }

  public async sendHtmlEmail(to: string, subject: string, html: string): Promise<EmailResult> {
    this.ensureInitialized();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'alerts@rescuegrid.campus.edu';

    if (!this.isConfigured || !this.transporter) {
      const errorMsg = this.configError || 'SMTP credentials (SMTP_USER and SMTP_PASS) are not configured. Actual email cannot be sent.';
      console.error(`[RescueGrid SMTP ERROR] Cannot send email to ${to}: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"RescueGrid Campus Emergency" <${from}>`,
        to,
        subject,
        html,
      });
      console.log(`[RescueGrid SMTP] Email successfully dispatched to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[RescueGrid SMTP Delivery Failure] Failed sending to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  public async sendSignupOtp(to: string, name: string, otp: string): Promise<EmailResult> {
    const subject = `[RescueGrid] Verify Your Campus Account - OTP: ${otp}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background: #0f172a; padding: 15px; border-radius: 6px; text-align: center;">
          <h2 style="color: #ef4444; margin: 0; font-size: 24px;">RescueGrid Campus Safety</h2>
          <p style="color: #94a3b8; margin: 5px 0 0 0;">Emergency Reporting & Response Network</p>
        </div>
        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          <p>Hello <strong>${name || 'Campus Member'}</strong>,</p>
          <p>Thank you for registering on RescueGrid. Use the verification code below to verify your email and activate your account:</p>
          <div style="background: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This OTP code expires in <strong>5 minutes</strong>. If you did not create this account, please disregard this email.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">RescueGrid Emergency Management • MongoDB Atlas Backend</p>
      </div>
    `;
    return this.sendHtmlEmail(to, subject, html);
  }

  public async sendLoginOtp(to: string, name: string, otp: string): Promise<EmailResult> {
    const subject = `[RescueGrid] Your Two-Step Login Verification Code: ${otp}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background: #0f172a; padding: 15px; border-radius: 6px; text-align: center;">
          <h2 style="color: #ef4444; margin: 0; font-size: 24px;">RescueGrid Campus Safety</h2>
          <p style="color: #94a3b8; margin: 5px 0 0 0;">Two-Step Identity Verification</p>
        </div>
        <div style="padding: 20px 0; color: #334155; line-height: 1.6;">
          <p>Hello <strong>${name || 'Campus Member'}</strong>,</p>
          <p>A sign-in request was initiated for your RescueGrid account. Enter this code to proceed:</p>
          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #b91c1c;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">Valid for 5 minutes. Never share this code with anyone.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Campus Emergency Operations Center</p>
      </div>
    `;
    return this.sendHtmlEmail(to, subject, html);
  }

  public async sendIncidentNotification(to: string, name: string, code: string, status: string, notes?: string): Promise<EmailResult> {
    const subject = `[RescueGrid Update] Incident ${code} status changed to ${status}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #0f172a;">Emergency Incident Status Update</h3>
        <p>Hello ${name},</p>
        <p>The status of emergency report <strong>${code}</strong> has transitioned to: <strong style="color: #dc2626;">${status}</strong>.</p>
        ${notes ? `<p><strong>Responder Tactical Note:</strong> ${notes}</p>` : ''}
        <p style="font-size: 13px; color: #64748b;">Log into your RescueGrid portal to view live timeline progression.</p>
      </div>
    `;
    return this.sendHtmlEmail(to, subject, html);
  }
}

export const emailService = new EmailService();
