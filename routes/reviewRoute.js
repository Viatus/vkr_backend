var express = require('express');
var router = express.Router();

const {addReview, getAllReviews, getReviewsForCreation, getAverageRatingForCreation} = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/verifyAuth');

router.post('/reviews', verifyToken, addReview);
router.get('/reviews', getAllReviews);
router.get('/reviews/:id', getReviewsForCreation);
router.get('/rating/:id', getAverageRatingForCreation);

module.exports = router;