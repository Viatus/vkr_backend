var express = require('express');
var router = express.Router();
const multer = require('multer');

const { addAuthor,
    addRole,
    getRoles,
    approveAuthor,
    getAuthors,
    getUnapprovedAuthors,
    addAuthorRoleInCreation,
    getAuthorsRoles,
    getInvolvedInCreation,
    getAuthorById } = require('../controllers/authorController');
const { verifyToken } = require('../middleware/verifyAuth');

const { v4: uuidv4 } = require('uuid');
const path = require("path");

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "authors_covers");
    },
    filename: (req, file, cb) => {
        req.image_uuid = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, req.image_uuid + ext);
    }
});

router.post('/roles', verifyToken, addRole);
router.get('/roles', getRoles);
router.post('/authors', verifyToken, multer({ storage: storageConfig }).any("cover"), addAuthor);
router.put('/unapproved-authors/:id', verifyToken, approveAuthor);
router.get('/authors', getAuthors);
router.get('/unapproved-authors', verifyToken, getUnapprovedAuthors);
router.post('/author-role', verifyToken, addAuthorRoleInCreation);
router.get('/author-role/:id', getAuthorsRoles);
router.get('/creation-role/:id', getInvolvedInCreation);
router.get('/authors/:id', getAuthorById);

module.exports = router;