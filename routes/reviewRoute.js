var express = require('express');
var router = express.Router();

const { addReview, getAllReviews, getReviewsForCreation, getAverageRatingForCreation, getTopCreations, getReviewsByUser, getReviewById } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/verifyAuth');

router.post('/reviews/:id', verifyToken, addReview);
router.get('/reviews', getAllReviews);
router.get('/reviews-creation/:id', getReviewsForCreation);
router.get('/rating/:id', getAverageRatingForCreation);
router.get('/ranking', getTopCreations);
router.get('/reviews-by-user', verifyToken, getReviewsByUser);
router.get('/reviews/:id', getReviewById);

module.exports = router;