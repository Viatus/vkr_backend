const models = require('../database/models');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../database/models');

const addAuthor = async (req, res) => {
    if (req.client === undefined) {

    }
    if (req.body.name === undefined) {

    }
    if (req.body.description === undefined) {

    }

    try {
        const newAuthor = await models.Authors.create({ name: req.body.name, birthday: req.body.birthday, description: req.body.description, country: req.body.country, ClientId: req.client.id, current: false });
        console.log(newAuthor);
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const approveAuthor = async (req, res) => {
    if (!req.is_admin) {

    }

    models.Authors.findOne({ where: { id: req.body.new_record_id } }).then(async (result) => {
        if (result === undefined) {
            return res.status(500).json({ error: "Author does not exist" });
        }
        result.current = true;
        //result.CreationId = req.body.old_record_id;
        result.save().then(() => {
            /*models.Authors.findOne({ where: { id: req.body.old_record_id } }).then(async (second_result) => {
                if (second_result !== undefined) {
                    second_result.current = false;
                    second_result.save();
                }*/
            return res.status(200).json({ message: 'success' });
            //});
        });

    });
};

const addRole = async (req, res) => {
    if (!req.is_admin) {

    }
    if (req.body.name === undefined || req.body.description === undefined) {

    }

    try {
        const newRole = await models.Roles.create({ name: req.body.name, description: req.body.description });
        console.log(newRole);
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

};

const getRoles = async (req, res) => {
    models.Roles.findAll().then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
};

const getAuthors = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Authors.findAll({ attributes: ['id', 'name'], /*where: { current: true },*/ order: [[req.query.sort_param, req.query.sort_order]] }).then(async (result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
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
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message });
    });
};

const addAuthorRoleInCreation = async (req, res) => {
    console.log(req.body.author_id);
    console.log(req.body.role_id);
    console.log(req.body.creation_id);
    try {
        //перед этим еще чекнуть не существует ли оно
        sequelize.query('INSERT INTO "Participation"("AuthorId", "CreationId", "RoleId") VALUES(?,?,?)', {
            replacements: [req.body.author_id, req.body.creation_id, req.body.role_id],
            type: QueryTypes.INSERT
        });
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getAuthorsRoles = async (req, res) => {
    //Добавить where current
    models.Creations.findAll({ include: [{ model: models.Authors, through: "Participation", where: { id: req.params.id } }, { model: models.Roles, through: "Particiaption" }] }).then((result) => {
        return res.status(200).json({ result });
    }).catch((error) => {
        return res.status(500).json({ error: error.message });
    });
};

const getInvolvedInCreation = async (req, res) => {
    models.Roles.findAll({ include: [{ model: models.Authors, through: "Participation" }, { model: models.Creations, through: "Participation", where: { id: req.params.id } }] }).then((result) => {
        return res.status(200).json({ result });
    }).catch((error) => {
        return res.status(500).json({ error: error.message });
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
}