import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Создаём транспорт один раз
const transporter = nodemailer.createTransport({
  host: 'mail.hosting.reg.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userName, roomName, date, start, end, recipients } = req.body;

  if (!userName || !roomName || !date || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients provided' });
  }

  const isFemale = /[ая]$/i.test(userName.trim());
  const actionVerb = isFemale ? 'забронировала' : 'забронировал';
  const genderEnding = isFemale ? 'а' : '';

  const subject = `Бронирование: ${roomName} – ${date} ${start}`;
  const textMessage = `Добрый день. Я ${userName} ${actionVerb}${genderEnding} переговорную "${roomName}" на ${date} с ${start} до ${end}.`;
  
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Новое бронирование</h2>
      <p><strong>${userName}</strong> ${actionVerb}${genderEnding} переговорную <strong>${roomName}</strong>.</p>
      <p>📅 ${date}</p>
      <p>🕒 ${start} – ${end}</p>
      <hr />
      <p style="color: #666;">Это письмо отправлено автоматически.</p>
    </div>
  `;

  const fromAddress = process.env.EMAIL_FROM || 'we@vpluse.ru';

  try {
    const sendPromises = recipients.map((recipient: string) =>
      transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject,
        text: textMessage,
        html: htmlMessage,
      })
    );

    await Promise.all(sendPromises);

    console.log(`✅ Emails sent to ${recipients.join(', ')}`);
    res.status(200).json({ success: true, recipients });
  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}