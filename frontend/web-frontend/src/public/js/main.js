document.addEventListener('DOMContentLoaded', () => {

  // ── FORM PILLS ──────────────────────────────────────────────────
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

  // ── MINI TIMER EN DASHBOARD (solo visual, no choca con la página del timer) ──
  const dashTimer = document.getElementById('dash-timer');
  if (dashTimer && !document.getElementById('timer-display')) {
    let dashRestante = 25 * 60;
    const dashProgress = document.getElementById('dash-progress');
    const renderDash = () => {
      const m = String(Math.floor(dashRestante / 60)).padStart(2, '0');
      const s = String(dashRestante % 60).padStart(2, '0');
      dashTimer.textContent = `${m}:${s}`;
      const pct = ((25 * 60 - dashRestante) / (25 * 60)) * 100;
      if (dashProgress) dashProgress.style.width = pct + '%';
    };
    renderDash();
  }

  // ── CHECKBOXES DE TAREAS (dashboard) ────────────────────────────
  document.querySelectorAll('.task-list__check').forEach(cb => {
    cb.addEventListener('change', () => {
      const item = cb.closest('.task-list__item');
      if (item) item.classList.toggle('task-list__item--done', cb.checked);
    });
  });

  console.log('✅ TimeFocus cargado');
});
