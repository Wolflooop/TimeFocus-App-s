// src/middlewares/authWeb.js
// Verifica que el usuario tenga sesión iniciada
module.exports = (req, res, next) => {
  if (!req.session || !req.session.token) {
    return res.redirect('/login');
  }
  next();
};
