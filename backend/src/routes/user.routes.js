const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/', protect, userController.listUsers);
router.patch('/language', protect, userController.updateLanguage);
router.post('/language/request-french-otp', protect, userController.requestFrenchLanguageOtp);
router.post('/language/verify-french-otp', protect, userController.verifyFrenchLanguageOtp);
router.patch('/resume', protect, upload.single('photo'), userController.saveResume);
router.post('/internship-applications', protect, userController.applyForInternship);
router.post('/friend-request/:targetUserId', protect, userController.sendFriendRequest);
router.post('/accept-request/:requesterId', protect, userController.acceptFriendRequest);

module.exports = router;
