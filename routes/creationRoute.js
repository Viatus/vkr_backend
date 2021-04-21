var express = require('express');
var router = express.Router();
const {verifyToken} = require('../middleware/verifyAuth');
const {
    getAllCreations,
	getAllCreationTypes,
    getCreationById,
    addCreationRecord,
    addCreationType,
    approveCreation,
    addTag,
    getAllTags,
    getSimilarCreationsOnTagsById,
	getUnapprovedCreations,
	removeCreation,
} = require('../controllers/creationController');

router.post('/genres', verifyToken, addCreationType);
router.get('/genres', getAllCreationTypes);
router.get('/creations/:id', getCreationById);
router.get('/creations', getAllCreations);
router.post('/creations', verifyToken, addCreationRecord);
router.post('/creations_approve', verifyToken, approveCreation);
router.get('/creations-similar', getSimilarCreationsOnTagsById);
router.get('/creations-unapproved', getUnapprovedCreations);
router.delete('/creations/:id', removeCreation);

router.get('/tags', getAllTags);
router.post('/tags', verifyToken, addTag);

module.exports = router;