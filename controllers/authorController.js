const models = require('../database/models');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../database/models');
const { Sequelize } = require('../database/models');
const {
    StatusCodes,
} = require('http-status-codes');
const Op = Sequelize.Op;
const fs = require('fs')

const addAuthor = async (req, res) => {
    if (req.body.name === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует имя автора' });
    }
    if (req.body.description === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует описание автора' });
    }

    try {
        const newAuthor = await models.Authors.create({ name: req.body.name, birthday: req.body.birthday, description: req.body.description, country: req.body.country, ClientId: req.client.id, current: false, image_uuid: req.image_uuid });
        console.log(newAuthor);
        return res.status(StatusCodes.CREATED).json({ newAuthor });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getAuthorById = async (req, res) => {
    models.Authors.findOne({ where: { id: req.params.id } }).then(async (result) => {
        const file = `${__dirname}/../authors_covers/${result.dataValues.image_uuid}.jpg`;
        try {
            result.dataValues.image = fs.readFileSync(file, 'base64');
        } catch (err) {
        }
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
};

const approveAuthor = async (req, res) => {
    if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Недостаточно прав' });
    }

    models.Authors.findOne({ where: { id: req.params.id } }).then(async (result) => {
        if (result === undefined) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Author does not exist" });
        }
        if (req.body.description !== undefined) {
            result.description = req.body.description;
        }
        if (req.body.birthday !== undefined) {
            result.birthday = req.body.birthday;
        }
        if (req.body.country !== undefined) {
            result.country = req.body.country;
        }

        result.current = true;
        //result.CreationId = req.body.old_record_id;
        result.save().then(() => {
            /*models.Authors.findOne({ where: { id: req.body.old_record_id } }).then(async (second_result) => {
                if (second_result !== undefined) {
                    second_result.current = false;
                    second_result.save();
                }*/
            return res.status(StatusCodes.OK).json({ message: 'success' });
            //});
        }).catch((err) => {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
        });

    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
};

const addRole = async (req, res) => {
    if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Недостаточно прав' });
    }
    if (req.body.name === undefined || req.body.description === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует имя или описание роли' });
    }

    try {
        const newRole = await models.Roles.create({ name: req.body.name, description: req.body.description });
        console.log(newRole);
        return res.status(StatusCodes.CREATED).json({ newRole });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
    }

};

const getRoles = async (req, res) => {
    models.Roles.findAll().then((result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
};

const getAuthors = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    if (req.query.string === undefined) {
        req.query.string = "%";
    } else {
        req.query.string = "%" + req.query.string + "%";
    }

    models.Authors.findAll({ attributes: ['id', 'name'], where: { current: true }, where: { name: { [Op.like]: req.query.string } }, order: [[req.query.sort_param, req.query.sort_order]] }).then(async (result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
};

const getUnapprovedAuthors = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Authors.findAll({ attributes: ['id', 'name'], where: { current: false }, order: [[req.query.sort_param, req.query.sort_order]] }).then((result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
};

const addAuthorRoleInCreation = async (req, res) => {
    if (req.body.author_id === undefined || req.body.role_id === undefined || req.body.creation_id === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id автороа, произведения или роли' });
    }
    try {
        //перед этим еще чекнуть не существует ли оно
        sequelize.query('INSERT INTO "Participation"("AuthorId", "CreationId", "RoleId") VALUES(?,?,?)', {
            replacements: [req.body.author_id, req.body.creation_id, req.body.role_id],
            type: QueryTypes.INSERT
        });
        return res.status(StatusCodes.OK).json({ message: 'success' });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getAuthorsRoles = async (req, res) => {
    //Добавить where current
    models.Creations.findAll({ include: [{ model: models.Authors, attributes: [], through: "Participation", where: { id: req.params.id } }, { model: models.Roles, through: "Participation" }, { model: models.Creation_Names, attributes: ['name'] }] }).then((result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((error) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    });
};

const getInvolvedInCreation = async (req, res) => {
    models.Roles.findAll({ include: [{ model: models.Authors, through: "Participation" }, { model: models.Creations, through: "Participation", where: { id: req.params.id }, include: [{ model: models.Creation_Names, attributes: ['name'] }] }] }).then((result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((error) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    });
};


module.exports = {
    addAuthor,
    addRole,
    getRoles,
    approveAuthor,
    getUnapprovedAuthors,
    getAuthors,
    addAuthorRoleInCreation,
    getAuthorsRoles,
    getInvolvedInCreation,
    getAuthorById,
}