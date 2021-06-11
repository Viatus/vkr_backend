var express = require('express');
var router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/verifyAuth');
const {
    getAllCreations,
    getAllCreationTypes,
    getCreationById,
    addCreationRecord,
    addCreationType,
    getCreationTypeInfo,
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
    getAllCreationsByUser,
    getAllNamesForCreation,
    addNameToCreation,
    addUserRecommendation,
    getUserRecommendationsForCreation,
    addCreationRelation,
    getCreationRelationsForCreation,
    getRecommendationsForUser,
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
router.get('/genres/:id', getCreationTypeInfo);

router.get('/creations/:id', getCreationById);
router.get('/creations', getAllCreations);
router.post('/creations', verifyToken, multer({ storage: storageConfig }).any("cover"), addCreationRecord);
router.put('/creations-unapproved/:id', verifyToken, approveCreation);
router.get('/creations-similar', getSimilarCreationsOnTagsById);
router.get('/creations-unapproved', getUnapprovedCreations);
router.get('/creations-search', searchCreations);
router.get('/creation-tags/:id', getCreationTags);
router.delete('/creations/:id', removeCreation);
router.get('/creations-similar-by-author/:id', getSimilarCreationsOnAuthorsById);
router.get('/unapproved-creations-by-user', verifyToken, getUnapprovedCreationsByUser);
router.get('/creations-by-user', verifyToken, getAllCreationsByUser);
router.post('/creation-names/:id', verifyToken, addNameToCreation);
router.get('/creation-names/:id', getAllNamesForCreation);

router.post('/creation-relations', verifyToken, addCreationRelation);
router.get('/creation-relations/:id', getCreationRelationsForCreation);

router.post('/user-reccomendations', verifyToken, addUserRecommendation);
router.get('/user-reccomendations/:id', getUserRecommendationsForCreation);

router.get('/tags', getAllTags);
router.post('/tags', verifyToken, addTag);

router.get('/user-profile-recs', verifyToken, getRecommendationsForUser);

module.exports = router;