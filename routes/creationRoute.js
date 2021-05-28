var express = require('express');
var router = express.Router();
const multer = require('multer');
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
    searchCreations,
    getCreationTags,
    getSimilarCreationsOnAuthorsById,
    getUnapprovedCreationsByUser,
    getAllCreationsByUser
} = require('../controllers/creationController');
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "covers");
    },
    filename: (req, file, cb) => {
        req.image_uuid = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, req.image_uuid + ext);
    }
});

router.post('/genres', /*verifyToken,*/ addCreationType);
router.get('/genres', getAllCreationTypes);
router.get('/creations/:id', getCreationById);
router.get('/creations', getAllCreations);
router.post('/creations', verifyToken, multer({storage:storageConfig}).any("cover"),addCreationRecord);
router.post('/creations_approve', verifyToken, approveCreation);
router.get('/creations-similar', getSimilarCreationsOnTagsById);
router.get('/creations-unapproved', getUnapprovedCreations);
router.get('/creations-search', searchCreations);
router.get('/creation-tags/:id', getCreationTags);
router.delete('/creations/:id', removeCreation);
router.get('/creations-similar-by-author/:id', getSimilarCreationsOnAuthorsById);
router.get('/unapproved-creations-by-user', verifyToken, getUnapprovedCreationsByUser);
router.get('/creations-by-user', verifyToken, getAllCreationsByUser);

router.get('/tags', getAllTags);
router.post('/tags', verifyToken, addTag);

module.exports = router;