import type { VercelRequest, VercelResponse } from '@vercel/node';
import Email from 'vercel-email';

export const config = {
  runtime: 'edge', // обязательно для работы vercel-email
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userName, roomName, date, start, end } = req.body;

  if (!userName || !roomName || !date || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Определяем пол и склонение
  const isFemale = /[ая]$/i.test(userName.trim());
  const actionVerb = isFemale ? 'забронировала' : 'забронировал';
  const genderEnding = isFemale ? 'а' : '';

  // Тема и тексты письма
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

  try {
    await Email.send({
      to: process.env.EMAIL_TO!,
      from: process.env.EMAIL_FROM!,
      subject: subject,
      text: textMessage,
      html: htmlMessage,
    });

    console.log(`✅ Email sent to ${process.env.EMAIL_TO}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}