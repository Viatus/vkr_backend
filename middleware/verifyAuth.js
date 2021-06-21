const jwt = require('jsonwebtoken');
const {
    StatusCodes,
} = require('http-status-codes');


const verifyToken = (req, res, next) => {
    try {
        req.client = jwt.verify(req.headers.authorization, process.env.secret);
        console.log(req.client);
        return next();
    } catch (err) {
        console.log(err)
        return res.status(StatusCodes.UNAUTHORIZED);
    }
};

module.exports = {
    verifyToken
}