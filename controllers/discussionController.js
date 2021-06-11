const { Sequelize } = require('../database/models');
const models = require('../database/models');
const {
    StatusCodes,
} = require('http-status-codes');

const addDiscussion = async (req, res) => {
    if (req.body.CreationId === undefined || req.body.title === undefined || req.body.content === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id произведения или название обсуждения или содержимое его тела' });
    }
    models.Discussions.create({ CreationId: req.body.CreationId, title: req.body.title, content: req.body.content }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.CREATED).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getCreationDiscussions = async (req, res) => {
    models.Discussions.findAll({ where: { CreationId: req.params.id } }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getDiscussionInfoById = async (req, res) => {
    models.Discussions.findOne({ where: { id: req.params.id } }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });

}

const addComment = async (req, res) => {
    if (req.body.DiscussionId === undefined || req.body.content === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id обсуждения или содержимое комментария' });
    }
    //Дату публикации думаю все же здесь устанавливать а не на клиентской части?
    models.Comments.create({ DiscussionId: req.body.DiscussionId, content: req.body.content, ClientId: req.client.id, datePublished: req.body.datePublished, parentComment: req.body.parentComment }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.CREATED).json({ result });
    }).catch((err) => {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getCommentsForDiscussion = async (req, res) => {
    //Пагинацию бы добавить думаю(уже?)
    if (req.query.limit === undefined || req.query.limit < 1) {
        req.query.limit = 5;
    }
    if (req.query.offset === undefined || req.query.offset < 0) {
        req.query.offset = 0;
    }
    models.Comments.findAll({ where: { DiscussionId: req.params.id }, include: [{ model: models.Clients, attributes: ['nickname'] }], offset: req.query.offset, limit: req.query.limit }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });

}

module.exports = {
    addDiscussion,
    getCreationDiscussions,
    addComment,
    getCommentsForDiscussion,
    getDiscussionInfoById,
}