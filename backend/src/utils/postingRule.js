function getPostLimitByFriendCount(friendCount) {
  if (friendCount > 10) {
    return { limit: Infinity, label: 'Unlimited posting unlocked' };
  }

  if (friendCount >= 2) {
    return { limit: 2, label: '2 posts per day unlocked' };
  }

  return { limit: 1, label: '1 post per day' };
}

module.exports = { getPostLimitByFriendCount };
