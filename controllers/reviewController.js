const { Sequelize } = require('sequelize');
const models = require('../database/models');

const addReview = async (req, res) => {
    if (req.client === undefined) {
        //Вернуть ошибку
    }

    const { score, content, creationId } = req.body;

    if (score === undefined || creationId === undefined) {
        //Вернуть ошибку
    }

    models.Reviews.findOne({ where: { CreationId: creationId, ClientId: req.client.id } }).then((result) => {
        if (result !== undefined) {
            return res.status(400).json({ error: "Такой отзыв уже сущетсвует" });
        } else {
            models.Reviews.create({ score: score, content: content, CreationId: creationId, ClientId: req.client.id }).then((result) => {
                console.log(result);
                return res.status(0);
            }).catch((err) => {
                return res.status(500).json(err);
            });
        }
    });
}

const getAllReviews = async (req, res) => {
    models.Reviews.findAll({ where: { content: { [Sequelize.Op.ne]: null } }, attributes: ["score", "content"], include: [{model: models.Clients, required: true, attributes: ["nickname"]}] }).then((result) => {
        console.log(result);
        return res.json(result);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}

const getAverageRatingForCreation = async (req, res) => {
    models.Reviews.findAll({ where: { CreationId: req.params.id }, attributes: ["score"]  }).then((result) => {
        const amount = result.length;
        var sum = 0;
        for (var i = 0; i < amount; i++) {
            sum += result[i].score;
        }
        const avg = sum / amount;
        return res.json({ average: avg });
    }).catch((err) => {
        return res.status(500).json(err);
    });
}

const getReviewsForCreation = async (req, res) => {
    models.Reviews.findAll({ where: { CreationId: req.params.id } ,  attributes: { exclude: ["ClientId", "id","CreationId"]} , include: [{model: models.Clients, required: true, attributes: ["nickname"]}]}).then((result) => {
        return res.json(result);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}

module.exports = {
    addReview,
    getAllReviews,
    getAverageRatingForCreation,
    getReviewsForCreation
}