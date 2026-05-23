module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();  // user is logged in, continue
  }
  res.redirect('/login');  // not logged in, send to login page
};