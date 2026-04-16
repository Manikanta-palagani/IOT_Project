const nodemailer = require('nodemailer');
const { formatReadableTimestamp } = require('./time');

const normalizeEmailPassword = (value) => {
  if (!value) {
    return '';
  }

  return value.trim().replace(/\s+/g, '');
};

const normalizeRecipients = (recipients) => {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return [...new Set(recipients.map((recipient) => (recipient || '').trim().toLowerCase()).filter(Boolean))];
};

const resolveEventType = (event) => {
  const eventType = String(event?.eventType || '').trim().toLowerCase();

  if (eventType === 'fire' || eventType === 'intrusion') {
    return eventType;
  }

  if (event?.intrusion) {
    return 'intrusion';
  }

  return '';
};

const getTransporter = () => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const rawEmailPass = process.env.EMAIL_PASS;
  const emailPass = normalizeEmailPassword(rawEmailPass);

  if (!emailUser) {
    console.error('[Mailer] EMAIL_USER is missing from .env');
  }

  if (!rawEmailPass || !emailPass) {
    console.error('[Mailer] EMAIL_PASS is missing or empty after trimming whitespace');
  }

  if (!emailUser || !emailPass) {
    return null;
  }

  console.log('Using EMAIL_USER:', process.env.EMAIL_USER);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 465),
    secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
    requireTLS: process.env.EMAIL_REQUIRE_TLS ? process.env.EMAIL_REQUIRE_TLS === 'true' : false,
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 10000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 10000),
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const formatAlertEmail = (event) => {
  const formattedTime = formatReadableTimestamp(event.timestamp);
  const zone = event.zone || 'Main Entrance';
  const deviceId = event.deviceId || 'Unknown device';
  const eventType = resolveEventType(event);

  if (eventType === 'fire') {
    return {
      subject: '🔥 FIRE EMERGENCY ALERT',
      text: [
        'Hello,',
        '',
        'Fire detected near secured area.',
        '',
        `Event Time: ${formattedTime}`,
        `Zone: ${zone}`,
        `Device ID: ${deviceId}`,
        '',
        'Critical fire detected in room.',
        '',
        'Please evacuate immediately and check the smart home security dashboard.',
        '',
        'This is an automated smart home safety alert.',
        '',
        'Regards,',
        'Smart Home Security Monitoring System',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;background:linear-gradient(180deg,#2a0907 0%,#09090b 100%);color:#e5eef6;padding:24px;border-radius:18px;border:1px solid rgba(248,113,113,0.3);box-shadow:0 0 0 1px rgba(248,113,113,0.08),0 24px 80px rgba(153,27,27,0.4);max-width:680px;">
          <div style="background:linear-gradient(90deg,#ef4444 0%,#f97316 100%);padding:18px 20px;border-radius:14px;margin-bottom:18px;">
            <h2 style="margin:0;color:#fff;font-size:24px;line-height:1.2;">🔥 FIRE EMERGENCY ALERT</h2>
          </div>
          <div style="background:rgba(127,29,29,0.28);border:1px solid rgba(251,146,60,0.35);padding:18px;border-radius:14px;margin-bottom:18px;">
            <p style="margin:0 0 12px;color:#fff7ed;font-size:16px;line-height:1.7;font-weight:700;letter-spacing:0.02em;">CRITICAL FIRE DETECTED IN ROOM</p>
            <p style="margin:0;color:#fde68a;font-size:16px;line-height:1.7;">Fire detected near secured area.</p>
          </div>
          <div style="background:rgba(17,24,39,0.9);border:1px solid rgba(248,113,113,0.28);border-radius:16px;padding:16px 18px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(248,113,113,0.14);color:#cbd5e1;"><span style="color:#fdba74;">Event Time</span><span style="text-align:right;">${formattedTime}</span></div>
            <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(248,113,113,0.14);color:#cbd5e1;"><span style="color:#fdba74;">Zone</span><span style="text-align:right;">${zone}</span></div>
            <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;color:#cbd5e1;"><span style="color:#fdba74;">Device ID</span><span style="text-align:right;">${deviceId}</span></div>
          </div>
          <div style="background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.28);padding:16px;border-radius:14px;color:#ffe4c7;margin-bottom:18px;">
            Critical fire detected in room.
          </div>
          <p style="margin:0;color:#dbe4ee;line-height:1.7;">Please check your smart home security dashboard and evacuate immediately if needed.</p>
          <p style="margin:10px 0 0;color:#cbd5e1;line-height:1.7;">This is an automated smart home safety alert.</p>
          <p style="margin:18px 0 0;color:#f8fafc;line-height:1.7;">Regards,<br/>Smart Home Security Monitoring System</p>
        </div>
      `,
    };
  }

  return {
    subject: `🚨 Security Alert - ${formattedTime} - ${event.id}`,
    text: [
      'Hello,',
      '',
      'A suspicious person is attempting to access your locked room.',
      '',
      `Event Time: ${formattedTime}`,
      `Zone: ${zone}`,
      `Device ID: ${deviceId}`,
      'Threat Level: HIGH',
      '',
      'Possible theft attempt near secured area.',
      '',
      'Please check your smart home security dashboard and verify the area immediately.',
      '',
      'This is an automated smart home security alert.',
      '',
      'Regards,',
      'Smart Home Security Monitoring System',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;background:linear-gradient(180deg,#1a0505 0%,#070b12 100%);color:#e5eef6;padding:24px;border-radius:18px;border:1px solid rgba(239,68,68,0.25);box-shadow:0 0 0 1px rgba(239,68,68,0.08),0 24px 80px rgba(127,29,29,0.35);max-width:680px;">
        <div style="background:linear-gradient(90deg,#ef4444 0%,#b91c1c 100%);padding:18px 20px;border-radius:14px;margin-bottom:18px;">
          <h2 style="margin:0;color:#fff;font-size:24px;line-height:1.2;">🚨 URGENT SECURITY ALERT - Possible Theft Attempt</h2>
        </div>
        <div style="background:rgba(127,29,29,0.28);border:1px solid rgba(248,113,113,0.3);padding:18px;border-radius:14px;margin-bottom:18px;">
          <p style="margin:0 0 12px;color:#f8fafc;font-size:16px;line-height:1.7;font-weight:700;letter-spacing:0.02em;">RED ALERT</p>
          <p style="margin:0;color:#e2e8f0;font-size:16px;line-height:1.7;">A suspicious person is attempting to access your locked room.</p>
        </div>
        <div style="background:rgba(17,24,39,0.9);border:1px solid rgba(248,113,113,0.28);border-radius:16px;padding:16px 18px;margin-bottom:18px;">
          <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(248,113,113,0.14);color:#cbd5e1;"><span style="color:#fca5a5;">Event Time</span><span style="text-align:right;">${formattedTime}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(248,113,113,0.14);color:#cbd5e1;"><span style="color:#fca5a5;">Zone</span><span style="text-align:right;">${zone}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(248,113,113,0.14);color:#cbd5e1;"><span style="color:#fca5a5;">Device ID</span><span style="text-align:right;">${deviceId}</span></div>
          <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;color:#cbd5e1;"><span style="color:#fca5a5;">Threat Level</span><span style="text-align:right;color:#f87171;font-weight:700;">HIGH</span></div>
        </div>
        <div style="background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.28);padding:16px;border-radius:14px;color:#fecaca;margin-bottom:18px;">
          Possible theft attempt near secured area.
        </div>
        <p style="margin:0;color:#dbe4ee;line-height:1.7;">Please check your smart home security dashboard and verify the area immediately.</p>
        <p style="margin:10px 0 0;color:#cbd5e1;line-height:1.7;">This is an automated smart home security alert.</p>
        <p style="margin:18px 0 0;color:#f8fafc;line-height:1.7;">Regards,<br/>Smart Home Security Monitoring System</p>
      </div>
    `,
  };
};

const sendSecurityAlertEmail = async (recipients, event) => {
  const transporter = getTransporter();
  const recipientList = normalizeRecipients(recipients);

  console.log('Recipients list:', recipientList);

  if (!transporter || !recipientList.length) {
    return false;
  }

  const { subject, text, html } = formatAlertEmail(event);

  try {
    await transporter.verify();

    const fromAddress = (process.env.EMAIL_USER || '').trim();

    const sendResults = await Promise.allSettled(
      recipientList.map((recipient) =>
        transporter.sendMail({
          from: `Smart Home Security <${fromAddress}>`,
          replyTo: fromAddress,
          to: recipient,
          subject,
          text,
          html,
          priority: 'high',
          headers: {
            'X-Priority': '1',
            Importance: 'high',
          },
        })
      )
    );

    const acceptedRecipients = [];
    const rejectedRecipients = [];

    sendResults.forEach((result, index) => {
      const recipient = recipientList[index];

      if (result.status === 'fulfilled') {
        const info = result.value;
        console.log('Mail sent successfully:', {
          recipient,
          response: info.response,
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          envelope: info.envelope,
        });

        if (info.accepted && info.accepted.length) {
          acceptedRecipients.push(recipient);
        } else {
          rejectedRecipients.push(recipient);
          console.error('[Mailer] No accepted recipients reported for:', recipient);
        }
      } else {
        rejectedRecipients.push(recipient);
        console.error('[Mailer] Mail send failed for recipient:', recipient, result.reason && result.reason.stack ? result.reason.stack : result.reason);
      }
    });

    return acceptedRecipients.length > 0 && rejectedRecipients.length === 0;
  } catch (error) {
    console.error('Mail send failed:', error && error.stack ? error.stack : error);
    throw error;
  }
};

module.exports = {
  sendSecurityAlertEmail,
};