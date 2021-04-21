var express = require('express');
var router = express.Router();
const {
    registerClient,
    loginClient
} = require('../controllers/clientController');

router.post('/register', registerClient);
router.post('/login', loginClient);

module.exports = router;