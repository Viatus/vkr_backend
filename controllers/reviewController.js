const { Sequelize } = require('sequelize');
const models = require('../database/models');
const Op = Sequelize.Op;
const {
    StatusCodes,
} = require('http-status-codes');


const addReview = async (req, res) => {
    const { score, content } = req.body;
    const creationId = req.params.id;
    if (content === undefined || content === "") {
        conten = null;
    }

    if (score === undefined || creationId === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id произведения или оценка' });
    }

    models.Reviews.findOne({ where: { CreationId: creationId, ClientId: req.client.id } }).then((result) => {
        if (result !== null) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такой отзыв уже сущетсвует" });
        } else {
            models.Reviews.create({ score: score, content: content, CreationId: creationId, ClientId: req.client.id }).then((result) => {
                console.log(result);
                return res.status(StatusCodes.OK).json({ result });;
            }).catch((err) => {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
            });
        }
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    });
}

const getAllReviews = async (req, res) => {
    models.Reviews.findAll({ where: { content: { [Sequelize.Op.ne]: null } }, attributes: ["score", "content"], include: [{ model: models.Clients, required: true, attributes: ["nickname"] }] }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.OK).json(result);
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
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
        return res.status(StatusCodes.OK).json({ average: avg });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    });
}

const getReviewsForCreation = async (req, res) => {
    models.Reviews.findAll({ where: { CreationId: req.params.id }, attributes: { exclude: ["ClientId", "id", "CreationId"] }, include: [{ model: models.Clients, required: true, attributes: ["nickname"] }] }).then((result) => {
        return res.status(StatusCodes.OK).json(result);
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    });
}

const getReviewsByUser = async (req, res) => {
    models.Reviews.findAll({ where: { ClientId: req.client.id }, attributes: { exclude: ["ClientId", "id", "CreationId"] }, include: [{ model: models.Creations, required: true, attributes: ["id"], include: [{ model: models.Creation_Names, attributes: ['name'] }] }] }).then((result) => {
        return res.status(StatusCodes.OK).json(result);
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
    });
}

//ПОЧИНИТЬ ИМЕНА(но они работают, почему здесь этот комментарий?)
const getTopCreations = async (req, res) => {
    //ПРоверки обновить
    console.log(req.query.genres);
    console.log(req.query.tags);
    console.log(req.query.string);
    if (req.query.limit === undefined) {
        req.query.limit = 10;
    }
    if (req.query.page === undefined) {
        req.query.page = 1;
    }
    if (req.query.string === undefined || req.query.string === "") {
        req.query.string = "%";
    } else {
        req.query.string = "%" + req.query.string + "%";
    }
    if (req.query.genres === undefined || req.query.genres === []) {
        if (req.query.tags === undefined || req.query.tags === []) {
            models.Creations.findAll({
                attributes: ["Creations.id", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')),
                    "avg_rating"]], include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Creation_Names, attributes: ['name'], where: { name: { [Op.like]: req.query.string } } }],
                group: ['Creations.id', 'Creation_Names.name'],
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
                attributes: ["Creations.id", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')), "avg_rating"]],
                include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Tags, through: { attributes: [] }, attributes: [], where: { id: req.query.tags } }, { model: models.Creation_Names, attributes: ['name'], where: { name: { [Op.like]: req.query.string } } }],
                group: ['Creations.id', 'Creation_Names.name'],
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
                attributes: ["Creations.id", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')), "avg_rating"]],
                include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Creation_types, attributes: [], where: { id: req.query.genres } }, { model: models.Creation_Names, attributes: ['name'], where: { name: { [Op.like]: req.query.string } } }],
                group: ['Creations.id', 'Creation_Names.name'],
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
                attributes: ["Creations.id", [Sequelize.fn('AVG', Sequelize.col('creation_reviews.score')), "avg_rating"]],
                include: [{ model: models.Reviews, as: "creation_reviews", attributes: [] }, { model: models.Creation_types, attributes: [], where: { id: req.query.genres } }, { model: models.Tags, through: { attributes: [] }, attributes: [], where: { id: req.query.tags } }, { model: models.Creation_Names, attributes: ['name'], where: { name: { [Op.like]: req.query.string } } }],
                group: ['Creations.id', 'Creation_Names.name'],
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