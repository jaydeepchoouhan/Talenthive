const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { getDayBounds } = require('../utils/date');
const { getPostLimitByFriendCount } = require('../utils/postingRule');
const { uploadMediaFiles } = require('../utils/media');

async function buildPostResponse(postId) {
  const post = await Post.findById(postId)
    .populate('author', 'name avatar email')
    .lean();

  if (!post) {
    return null;
  }

  const comments = await Comment.find({ post: postId })
    .populate('author', 'name avatar')
    .sort({ createdAt: 1 })
    .lean();

  return {
    ...post,
    comments
  };
}

async function getPostingStatus(req, res) {
  const user = await User.findById(req.user._id);
  const { start, end } = getDayBounds();
  const postsToday = await Post.countDocuments({
    author: req.user._id,
    createdAt: { $gte: start, $lte: end }
  });

  const rule = getPostLimitByFriendCount(user.friends.length);
  return res.json({
    friends: user.friends.length,
    postsToday,
    limit: Number.isFinite(rule.limit) ? rule.limit : null,
    unlimited: !Number.isFinite(rule.limit),
    label: rule.label,
    remaining: Number.isFinite(rule.limit) ? Math.max(rule.limit - postsToday, 0) : 'unlimited'
  });
}

async function createPost(req, res) {
  const user = await User.findById(req.user._id);
  const rule = getPostLimitByFriendCount(user.friends.length);
  const { start, end } = getDayBounds();

  const postsToday = await Post.countDocuments({
    author: user._id,
    createdAt: { $gte: start, $lte: end }
  });

  if (Number.isFinite(rule.limit) && postsToday >= rule.limit) {
    return res.status(429).json({
      message: `Posting limit reached. ${rule.label}`
    });
  }

  if (!req.body.caption && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ message: 'Caption or media is required' });
  }

  const media = await uploadMediaFiles(req.files || []);
  const post = await Post.create({
    author: user._id,
    caption: req.body.caption || '',
    media
  });

  const populatedPost = await Post.findById(post._id).populate('author', 'name avatar email');
  const io = req.app.get('io');
  io.emit('new-post', populatedPost);

  return res.status(201).json({ post: populatedPost });
}

async function getFeed(_req, res) {
  const posts = await Post.find()
    .populate('author', 'name avatar email')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const postIds = posts.map((post) => post._id);
  const comments = await Comment.find({ post: { $in: postIds } })
    .populate('author', 'name avatar')
    .sort({ createdAt: 1 })
    .lean();

  const commentsByPost = comments.reduce((acc, comment) => {
    const key = comment.post.toString();
    acc[key] = acc[key] || [];
    acc[key].push(comment);
    return acc;
  }, {});

  const mapped = posts.map((post) => ({
    ...post,
    comments: commentsByPost[post._id.toString()] || []
  }));

  return res.json({ posts: mapped });
}

async function getPostById(req, res) {
  const post = await buildPostResponse(req.params.postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  return res.json({ post });
}

async function toggleLike(req, res) {
  const { postId } = req.params;
  const post = await Post.findById(postId).populate('author', 'name avatar');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());
  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();

  const io = req.app.get('io');
  io.emit('post-liked', { postId, likes: post.likes.map((id) => id.toString()) });

  return res.json({ liked: !alreadyLiked, likes: post.likes.map((id) => id.toString()) });
}

async function addComment(req, res) {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    content
  });

  const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar');
  const io = req.app.get('io');
  io.emit('new-comment', populatedComment);

  return res.status(201).json({ comment: populatedComment });
}

async function sharePost(req, res) {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.sharesCount += 1;
  await post.save();

  const shareLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/posts/${postId}`;
  const io = req.app.get('io');
  io.emit('post-shared', { postId, sharesCount: post.sharesCount });

  return res.json({
    message: 'Post shared count updated',
    shareLink,
    sharesCount: post.sharesCount
  });
}

module.exports = {
  getPostingStatus,
  createPost,
  getFeed,
  getPostById,
  toggleLike,
  addComment,
  sharePost
};
