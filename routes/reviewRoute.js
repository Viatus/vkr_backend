var express = require('express');
var router = express.Router();

const { addReview, getAllReviews, getReviewsForCreation, getAverageRatingForCreation, getTopCreations, getReviewsByUser } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/verifyAuth');

router.post('/reviews/:id', verifyToken, addReview);
router.get('/reviews', getAllReviews);
router.get('/reviews/:id', getReviewsForCreation);
router.get('/rating/:id', getAverageRatingForCreation);
router.get('/ranking', getTopCreations);
router.get('/reviews-by-user', verifyToken, getReviewsByUser);

module.exports = router;