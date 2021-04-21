const models = require('../database/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

const registerClient = async (req, res) => {
    const { nickname, email, password } = req.body;
    models.Clients.findOne({ where: { email: email } }).then(async (result) => {
        if (result) {
            return res.status(401).json({ err: 'user already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        try {
            const client = await models.Clients.create({ nickname: nickname, email: email, hash: hashedPassword, is_admin: false });
            return res.status(201).json({
                client,
            });
        } catch (error) {
            return res.status(500).json({ error: error.message })
        }
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}

const loginClient = async (req, res) => {
    const { email, password } = req.body;

    models.Clients.findOne({ where: { email: email } }).then(async (result) => {
        const hashedPassword = result.hash;
        const email = result.email;
        const id = result.id;
        const match = await bcrypt.compare(password, hashedPassword);

        if (match) {
            const token = await jwt.sign({ email, id }, process.env.secret);
            return res.json({ token: token, is_admin: result.is_admin });
        }
        return res.status(401);
    }).catch((err) => {
        return res.status(500).json({ error: err.message });
    });
}

module.exports = {
    registerClient,
    loginClient,
}
