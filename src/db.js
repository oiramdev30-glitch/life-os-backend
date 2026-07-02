import Dexie from 'dexie';

const db = new Dexie('LifeOSDB');

db.version(1).stores({
  habits: '++id, name, category, done, streak, logs',
  tasks: '++id, title, column_id, priority, tags, estimate, created_at, updated_at, isFocus, note, date',
  financeCards: '++id, preset_key, bank_name, card_type, balance, last_four, cutoff_day, payment_day',
  financeTransactions: '++id, card_id, tx_type, amount, category, date',
  focusSessions: '++id, tag, note, duration_seconds, date',
  mentalLogs: '++id, date, time, mood_value, journal_text',
  studyLogs: '++id, date, day_name, hours, topic',
  socialLogs: '++id, date, app_name, minutes',
  runningLogs: '++id, date, rpe, feeling, workout_type',
  gymLogs: '++id, date, exercise_id, exercise_name, weight_logged',
  gymSessions: '++id, date, rpe, feeling, total_tonnage',
  reminders: '++id, title, description, due_date, due_time, category, related_id, done, created_at',
  coachConversations: '++id, module, created_at, messages',
  weeklySummaries: '++id, week_start, content, generated_at',
  syncQueue: '++id, endpoint, method, data, timestamp, retries',
});

// Función para limpiar toda la base de datos (útil para reset)
export const clearDB = async () => {
  await db.delete();
};

export default db;