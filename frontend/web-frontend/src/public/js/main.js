document.addEventListener('DOMContentLoaded', () => {

  // ── POMODORO TIMER ──────────────────────────────────────────
  const timerDisplay = document.getElementById('timer-display');
  const btnPausar    = document.getElementById('btn-pausar');
  const btnReiniciar = document.getElementById('btn-reiniciar');

  if (timerDisplay) {
    const DURACIONES = { pomodoro: 25 * 60, corto: 5 * 60, largo: 15 * 60 };
    let duracion  = DURACIONES.pomodoro;
    let restante  = duracion;
    let corriendo = false;
    let intervalo = null;

    const render = () => {
      const m = String(Math.floor(restante / 60)).padStart(2, '0');
      const s = String(restante % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
      // Sincronizar también la tarjeta del dashboard si existe
      const miniTimer = document.querySelector('.timer__time');
      if (miniTimer) miniTimer.textContent = `${m}:${s}`;
    };

    const iniciar = () => {
      corriendo = true;
      if (btnPausar) btnPausar.textContent = 'Pausar';
      intervalo = setInterval(() => {
        if (restante > 0) {
          restante--;
          render();
        } else {
          clearInterval(intervalo);
          corriendo = false;
          if (btnPausar) btnPausar.textContent = 'Iniciar';
          // Notificación al terminar
          if (Notification.permission === 'granted') {
            new Notification('¡Sesión completada! 🎉', { body: 'Tómate un descanso.' });
          }
        }
      }, 1000);
    };

    const pausar = () => {
      clearInterval(intervalo);
      corriendo = false;
      if (btnPausar) btnPausar.textContent = 'Reanudar';
    };

    btnPausar?.addEventListener('click', () => {
      corriendo ? pausar() : iniciar();
    });

    btnReiniciar?.addEventListener('click', () => {
      clearInterval(intervalo);
      corriendo = false;
      restante = duracion;
      render();
      if (btnPausar) btnPausar.textContent = 'Iniciar';
    });

    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('timer-mode-btn--active'));
        btn.classList.add('timer-mode-btn--active');
        const modo = btn.dataset.mode;
        duracion = DURACIONES[modo] || DURACIONES.pomodoro;
        clearInterval(intervalo);
        corriendo = false;
        restante = duracion;
        render();
        if (btnPausar) btnPausar.textContent = 'Iniciar';
      });
    });

    render();

    // Pedir permiso para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

// ── FORM PILLS ────────────────────────────────────────────────
document.querySelectorAll('[data-group]').forEach(pill => {
  pill.addEventListener('click', () => {
    const grupo = pill.dataset.group;
    document.querySelectorAll(`[data-group="${grupo}"]`)
      .forEach(p => p.classList.remove('form-pill--active'));
    pill.classList.add('form-pill--active');
    const hidden = document.getElementById(`${grupo}-val`);
    if (hidden) hidden.value = pill.value;
  });
});

  // ── CHECKBOX DE TAREAS ────────────────────────────────────────
  document.querySelectorAll('.task-list__check').forEach(cb => {
    cb.addEventListener('change', () => {
      const item = cb.closest('.task-list__item');
      if (item) item.classList.toggle('task-list__item--done', cb.checked);
    });
  });

  console.log('✅ TimeFocus cargado');
});
