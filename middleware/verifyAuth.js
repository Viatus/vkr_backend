const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        req.client = jwt.verify(req.headers.authorization, process.env.secret);
        return next();
    } catch (err) {
        console.log(err)
        return res.status(401);
    }
};

module.exports = {
    verifyToken
}