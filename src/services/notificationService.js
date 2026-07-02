export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function sendNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  return new Notification(title, {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options
  });
}

// Recordatorio de hábitos pendientes
export function scheduleHabitReminder(habits) {
  const pending = habits.filter(h => !h.done);
  if (pending.length === 0) return;

  const titles = pending.map(h => h.name).join(', ');
  sendNotification('Hábitos pendientes', {
    body: `Tienes ${pending.length} hábito(s) pendiente(s): ${titles}`,
    tag: 'habit-reminder'
  });
}

// Función para programar recordatorios diarios
export function scheduleDailyReminders(habits) {
  // Verificar si ya se envió hoy
  const lastReminder = localStorage.getItem('last_habit_reminder');
  const today = new Date().toISOString().split('T')[0];
  
  if (lastReminder === today) return;
  
  // Esperar hasta las 9:00 PM para recordar
  const now = new Date();
  const targetHour = 21; // 9 PM
  const targetMinute = 0;
  
  if (now.getHours() >= targetHour) {
    // Si ya es después de las 9 PM, enviar ahora
    scheduleHabitReminder(habits);
    localStorage.setItem('last_habit_reminder', today);
  } else {
    // Programar para las 9 PM
    const msUntilTarget = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      targetHour,
      targetMinute
    ) - now;
    
    if (msUntilTarget > 0) {
      setTimeout(() => {
        scheduleHabitReminder(habits);
        localStorage.setItem('last_habit_reminder', today);
      }, msUntilTarget);
    }
  }
}