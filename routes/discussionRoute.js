var express = require('express');
var router = express.Router();
const multer = require('multer');

const { addDiscussion,
    getCreationDiscussions,
    addComment,
    getCommentsForDiscussion,
    getDiscussionInfoById,
} = require('../controllers/discussionController');
const { verifyToken } = require('../middleware/verifyAuth');

router.post('/discussions', verifyToken, addDiscussion);
router.get('/creation-discussions/:id', getCreationDiscussions);
router.get('/discussions/:id', getDiscussionInfoById);

router.post('/comments', verifyToken, addComment);
router.get('/discussion-comments/:id', getCommentsForDiscussion);


module.exports = router;