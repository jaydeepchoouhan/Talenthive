const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/verify-account', authController.verifyAccount);
router.post('/resend-account-otp', authController.resendAccountVerificationOtp);
router.post('/login', authController.login);
router.post('/verify-login-otp', authController.verifyChromeLoginOtp);
router.post('/resend-login-otp', authController.resendChromeLoginOtp);
router.get('/me', protect, authController.me);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/password-generator', authController.generatePassword);

module.exports = router;
