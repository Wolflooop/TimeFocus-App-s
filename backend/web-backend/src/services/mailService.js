// src/services/mailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

transporter.verify((err) => {
  if (err) console.warn('⚠️  Nodemailer:', err.message);
  else     console.log('✅ Nodemailer listo →', process.env.MAIL_USER);
});

exports.sendResetCode = async (toEmail, nombre, code) => {
  const expires = process.env.RESET_CODE_EXPIRES_MIN || 10;
  await transporter.sendMail({
    from:    process.env.MAIL_FROM || `TimeFocus <${process.env.MAIL_USER}>`,
    to:      toEmail,
    subject: `🔐 Tu código de recuperación: ${code}`,
    html: `
    <div style="font-family:Arial,sans-serif;background:#F5F5F8;padding:40px 20px;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#1A2035;padding:28px;text-align:center;">
          <p style="margin:0;font-size:32px;">🍅</p>
          <p style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">TimeFocus</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">UTXJ · Sistema de productividad</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#1A2035;font-weight:600;">Hola, ${nombre} 👋</p>
          <p style="font-size:14px;color:#8A9CC2;line-height:1.6;">
            Recibimos una solicitud para restablecer tu contraseña. Usa este código:
          </p>
          <div style="margin:28px 0;text-align:center;">
            <div style="display:inline-block;background:#F0F4FF;border:2px dashed #1A2035;border-radius:12px;padding:20px 40px;">
              <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#1A2035;">${code}</p>
            </div>
          </div>
          <p style="font-size:13px;color:#8A9CC2;text-align:center;">⏱ Expira en <strong>${expires} minutos</strong>.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #E8ECF4;">
          <p style="font-size:12px;color:#8A9CC2;">Si no solicitaste esto, ignora este correo.</p>
        </div>
        <div style="background:#F5F5F8;padding:16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8A9CC2;">TimeFocus © 2025 · UTXJ Xicotepec</p>
        </div>
      </div>
    </div>`,
  });
};

exports.sendWelcome = async (toEmail, nombre) => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM || `TimeFocus <${process.env.MAIL_USER}>`,
    to:      toEmail,
    subject: '🍅 Bienvenido a TimeFocus',
    html: `<div style="font-family:Arial;padding:32px;background:#F5F5F8;">
      <div style="background:#1A2035;border-radius:12px;padding:24px;text-align:center;color:#fff;max-width:400px;margin:0 auto;">
        <p style="font-size:32px;margin:0">🍅</p>
        <p style="font-size:20px;font-weight:700;margin:8px 0">¡Bienvenido, ${nombre}!</p>
        <p style="color:rgba(255,255,255,0.7);font-size:14px">Ya puedes iniciar sesión y comenzar a ser más productivo.</p>
      </div>
    </div>`,
  });
};
