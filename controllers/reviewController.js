const { Sequelize } = require('sequelize');
const models = require('../database/models');

const addReview = async (req, res) => {
    if (req.client === undefined) {
        //Вернуть ошибку
    }

    const { score, content } = req.body;
    const creationId = req.params.id;
    if (content === undefined || content === "") {
        conten = null;
    }

    if (score === undefined || creationId === undefined) {
        //Вернуть ошибку
    }

    models.Reviews.findOne({ where: { CreationId: creationId, ClientId: req.client.id } }).then((result) => {
        if (result !== null) {
            return res.status(400).json({ error: "Такой отзыв уже сущетсвует" });
        } else {
            models.Reviews.create({ score: score, content: content, CreationId: creationId, ClientId: req.client.id }).then((result) => {
                console.log(result);
                return res.status(200).json({ result });;
            }).catch((err) => {
                return res.status(500).json(err);
            });
        }
    });
}

const getAllReviews = async (req, res) => {
    models.Reviews.findAll({ where: { content: { [Sequelize.Op.ne]: null } }, attributes: ["score", "content"], include: [{ model: models.Clients, required: true, attributes: ["nickname"] }] }).then((result) => {
        console.log(result);
        return res.json(result);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}

const getAverageRatingForCreation = async (req, res) => {
    models.Reviews.findAll({ where: { CreationId: req.params.id }, attributes: ["score"] }).then((result) => {
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
    models.Reviews.findAll({ where: { CreationId: req.params.id }, attributes: { exclude: ["ClientId", "id", "CreationId"] }, include: [{ model: models.Clients, required: true, attributes: ["nickname"] }] }).then((result) => {
        return res.json(result);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}

const getReviewsByUser = async (req, res) => {
    models.Reviews.findAll({ where: { ClientId: req.client.id }, attributes: { exclude: ["ClientId", "id", "CreationId"] }, include: [{ model: models.Creations, required: true, attributes: ["name", "id"] }] }).then((result) => {
        return res.json(result);
    }).catch((err) => {
        return res.status(500).json(err);
    });
}

const getTopCreations = async (req, res) => {
    console.log(req.query.genres);
    console.log(req.query.tags);
    if (req.query.limit === undefined) {
        req.query.limit = 10;
    }
    if (req.query.page === undefined) {
        req.query.page = 1;
    }
    if (req.query.genres === undefined || req.query.genres === []) {
        if (req.query.tags === undefined || req.query.tags === []) {
            models.Creations.findAll({
                attributes: ["Creations.id", "Creations.name", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')),
                    "avg_rating"]], include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }],
                group: ['Creations.id', 'Creations.name'],
                raw: true,
                order: Sequelize.literal('avg_rating DESC')
            }).then((result) => {
                let slicedRes = result.slice((req.query.page - 1) * req.query.limit, req.query.page * req.query.limit);
                return res.json(slicedRes);
            }).catch((err) => {
                return res.status(500).json({ error: err.message });
            });
        } else {
            models.Creations.findAll({
                attributes: ["Creations.id", "Creations.name", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')), "avg_rating"]],
                include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Tags, through: { attributes: [] }, attributes: [], where: { id: req.query.tags } }],
                group: ['Creations.id', 'Creations.name'],
                raw: true,
                order: Sequelize.literal('avg_rating DESC')
            }).then((result) => {
                let slicedRes = result.slice((req.query.page - 1) * req.query.limit, req.query.page * req.query.limit);
                return res.json(slicedRes);
            }).catch((err) => {
                return res.status(500).json({ error: err.message });
            });
        }
    } else {
        if (req.query.tags === undefined || req.query.tags === []) {
            models.Creations.findAll({
                attributes: ["Creations.id", "Creations.name", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')), "avg_rating"]],
                include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Creation_types, attributes: [], where: { id: req.query.genres } }],
                group: ['Creations.id', 'Creations.name'],
                raw: true,
                order: Sequelize.literal('avg_rating DESC')
            }).then((result) => {
                let slicedRes = result.slice((req.query.page - 1) * req.query.limit, req.query.page * req.query.limit);
                return res.json(slicedRes);
            }).catch((err) => {
                return res.status(500).json({ error: err.message });
            });
        } else {
            models.Creations.findAll({
                attributes: ["Creations.id", "Creations.name", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')), "avg_rating"]],
                include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Creation_types, attributes: [], where: { id: req.query.genres } }, { model: models.Tags, through: { attributes: [] }, attributes: [], where: { id: req.query.tags } }],
                group: ['Creations.id', 'Creations.name'],
                raw: true,
                order: Sequelize.literal('avg_rating DESC')
            }).then((result) => {
                let slicedRes = result.slice((req.query.page - 1) * req.query.limit, req.query.page * req.query.limit);
                return res.json(slicedRes);
            }).catch((err) => {
                return res.status(500).json({ error: err.message });
            });
        }
    }
}

module.exports = {
    addReview,
    getAllReviews,
    getAverageRatingForCreation,
    getReviewsForCreation,
    getTopCreations,
    getReviewsByUser,
}