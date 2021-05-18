var express = require('express');
var router = express.Router();

const { addAuthor,
    addRole,
    getRoles,
    approveAuthor,
    getAuthors,
    getUnapprovedAuthors,
    addAuthorRoleInCreation,
    getAuthorsRoles,
    getInvolvedInCreation } = require('../controllers/authorController');
const { verifyToken } = require('../middleware/verifyAuth');

router.post('/roles', verifyToken, addRole);
router.get('/roles', getRoles);
router.post('/authors', verifyToken, addAuthor);
router.post('/unapproved-authors', verifyToken, approveAuthor);
router.get('/authors', getAuthors);
router.get('/unapproved-authors', verifyToken, getUnapprovedAuthors);
router.post('/author-role', verifyToken, addAuthorRoleInCreation);
router.get('/author-role/:id', getAuthorsRoles);
router.get('/creation-role/:id', getInvolvedInCreation);

module.exports = router;