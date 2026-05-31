import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export default async ({ req, res, log, error }) => {
  if (getApps().length === 0) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
      });
      log('✅ Firebase Admin успешно инициализирован');
    } catch (err) {
      error('❌ Ошибка инициализации Firebase Admin:', err.message);
      return res.json({ success: false, error: 'Firebase init failed' }, 500);
    }
  }

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
  token,
  title,
  body,
  type,
  list_id,
  task_id
} = payload;

    if (!token || !title || !body) {
      return res.json({ success: false, error: 'Missing required fields: token, title, or body' }, 400);
    }

   const message = {
  token,
  notification: {
    title,
    body,
  },

  data: {
    type: type || '',
    list_id: list_id || '',
    task_id: task_id || '',
  },

  android: {
    priority: 'high',
    notification: {
      sound: 'default',
      clickAction: 'FLUTTER_NOTIFICATION_CLICK',
    },
  },

  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1,
      },
    },
  },
};

    const response = await getMessaging().send(message);
    log(`✅ Пуш успешно отправлен! Message ID: ${response}`);

    return res.json({ success: true, messageId: response });
  } catch (err) {
    error('❌ Ошибка при отправке Push-уведомления:', err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};