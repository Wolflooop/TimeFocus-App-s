// src/services/mailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,   // Contraseña de aplicación Google
  },
});

// ── Verificar conexión al iniciar ─────────────────────────────────
transporter.verify((err) => {
  if (err) console.warn('⚠️  Nodemailer no pudo conectar. Verifica MAIL_USER y MAIL_PASS en .env\n   ', err.message);
  else     console.log('✅ Nodemailer listo →', process.env.MAIL_USER);
});

/**
 * Envía código de recuperación de contraseña
 * @param {string} toEmail
 * @param {string} nombre
 * @param {string} code - 6 dígitos
 */
exports.sendResetCode = async (toEmail, nombre, code) => {
  const expires = process.env.RESET_CODE_EXPIRES_MIN || 10;
  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F5F5F8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 20px;">
        <table width="420" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr><td style="background:#1A2035;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🍅</p>
            <p style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">TimeFocus</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">UTXJ · Sistema de productividad</p>
          </td></tr>
          <!-- Body -->
          <tr><td style="padding:32px;">
            <p style="margin:0;font-size:16px;color:#1A2035;font-weight:600;">Hola, ${nombre} 👋</p>
            <p style="margin:12px 0 0;font-size:14px;color:#8A9CC2;line-height:1.6;">
              Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de seguridad:
            </p>
            <!-- Code box -->
            <div style="margin:28px 0;text-align:center;">
              <div style="display:inline-block;background:#F0F4FF;border:2px dashed #1A2035;border-radius:12px;padding:20px 40px;">
                <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#1A2035;">${code}</p>
              </div>
            </div>
            <p style="margin:0;font-size:13px;color:#8A9CC2;text-align:center;">
              ⏱ Este código expira en <strong>${expires} minutos</strong>.
            </p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #E8ECF4;">
            <p style="margin:0;font-size:12px;color:#8A9CC2;line-height:1.6;">
              Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta seguirá segura.
            </p>
          </td></tr>
          <!-- Footer -->
          <tr><td style="background:#F5F5F8;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#8A9CC2;">TimeFocus © 2025 · UTXJ Xicotepec</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from:    process.env.MAIL_FROM || 'TimeFocus <noreply@utxj.edu.mx>',
    to:      toEmail,
    subject: `🔐 Tu código de recuperación: ${code}`,
    html,
  });
};

/**
 * Correo de bienvenida al registrarse
 */
exports.sendWelcome = async (toEmail, nombre) => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      toEmail,
    subject: '🍅 Bienvenido a TimeFocus',
    html: `<div style="font-family:Arial;padding:32px;background:#F5F5F8;">
      <div style="background:#1A2035;border-radius:12px;padding:24px;text-align:center;color:#fff;">
        <p style="font-size:32px;margin:0">🍅</p>
        <p style="font-size:20px;font-weight:700;margin:8px 0">¡Bienvenido, ${nombre}!</p>
        <p style="color:rgba(255,255,255,0.7);font-size:14px">Ya puedes iniciar sesión en TimeFocus y comenzar a ser más productivo.</p>
      </div>
    </div>`,
  });
};
