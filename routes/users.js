const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const wrapAsync = require('../utilities/wrapAsync');
const users = require('../controllers/users');

router.route('/register')
    .get(users.renderRegistrationForm)
    .post(wrapAsync(users.registerNewUser));

router.route('/login')
    .get(users.renderLoginForm)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.userLogin);

router.get('/logout', users.logout);

module.exports = router;