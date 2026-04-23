const router = require('express').Router();
const postController = require('../controllers/post.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/', protect, postController.getFeed);
router.get('/posting-status', protect, postController.getPostingStatus);
router.get('/:postId', postController.getPostById);
router.post('/', protect, upload.array('media', 4), postController.createPost);
router.post('/:postId/like', protect, postController.toggleLike);
router.post('/:postId/comment', protect, postController.addComment);
router.post('/:postId/share', protect, postController.sharePost);

module.exports = router;
