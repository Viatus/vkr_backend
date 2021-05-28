const { Sequelize } = require('../database/models');
const models = require('../database/models');
const Op = Sequelize.Op

const addCreationType = async (req, res) => {
    //Временно закоментировано
    /*if (!req.client.is_admin) {
        return res.status(500).json({ error: "Недостаточно привелегий" }); //Поменять статус
    }*/
    if (req.body.name === undefined) {
        return res.status(500).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    if (req.body.description === undefined) {
        return res.status(500).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    try {
        const newCreationType = await models.Creation_types.create({ name: req.body.name, description: req.body.description });
        console.log(newCreationType);
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const getAllCreationTypes = async (req, res) => {
    models.Creation_types.findAll().then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}

const addCreationRecord = async (req, res) => {
    if (req.body.name === undefined) {
        return res.status(500).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    if (req.body.creation_type === undefined) {
        return res.status(500).json({ error: "Отсутствует жанр" }); //Поменять статус
    }

    //Добавить UUID картинки к базе: готово?

    models.Creation_types.findOne({ where: { name: req.body.creation_type } }).then(async (result) => {
        try {
            if (result === undefined) {
                return res.status(500).json({ error: "Отсутствует жанр" });
            }
            const newCreation = await models.Creations.create({ name: req.body.name, CreationTypeId: result.id, date_published: req.body.date_published, description: req.body.description, is_approved: false, country: req.body.country, age_rating: req.body.age_rating, ClientId: req.client.id, current: false, date_updated: "2020-01-01 19:20:00", image_uuid: req.image_uuid });
            console.log(newCreation);
            //req.creation_id = newCreation.id;
            console.log(req.body.tags);
            let decoded_tags = JSON.parse(req.body.tags);
            console.log(decoded_tags[0]);
            for (var tag of decoded_tags) {
                models.Tags.findOne({ where: { name: tag } }).then((result) => {
                    if (result !== undefined) {
                        console.log(result);
                        newCreation.addTag(result);
                    }
                }).catch((err) => {
                    return res.status(500).json({ error: `error while adding tag: ${err.message}` });
                });
            }

            console.log(newCreation);
            return res.status(200).json({ result: newCreation });
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ error: error.message })
        }
    }).catch((err) => {
        console.log(err.message);
        return res.status(500).json({ error: err.message });
    });
};

const getAllCreations = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Creations.findAll({ attributes: ['id', 'name', 'CreationTypeId'], where: { current: true }, order: [[req.query.sort_param, req.query.sort_order]] }).then(async (result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });

};

const getAllCreationsByUser = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Creations.findAll({ attributes: ['id', 'name', 'CreationTypeId'], where: { current: true, ClientId: req.client.id }, order: [[req.query.sort_param, req.query.sort_order]] }).then(async (result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });

};

const getCreationById = async (req, res) => {
    models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        models.Reviews.findAll({ where: { CreationId: req.params.id }, attributes: ["score"] }).then((result2) => {
            const amount = result2.length;
            var sum = 0;
            for (var i = 0; i < amount; i++) {
                sum += result2[i].score;
            }
            const avg = sum / amount;
            result.dataValues.rating = avg;
            return res.json({ result });
        }).catch((err) => {
            return res.status(500).json(err);
        });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}

const addTag = async (req, res) => {
    if (req.body.name === undefined) {
        return res.status(500).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    if (req.body.description === undefined) {
        return res.status(500).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    try {
        const newCreation = await models.Tags.create({ name: req.body.name, description: req.body.description });
        console.log(newCreation);
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
};

const getAllTags = async (req, res) => {
    models.Tags.findAll().then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}


const removeCreation = async (req, res) => {
    //Временно закомментировано
    /*if (!req.client.is_admin) {
        return res.status(500).json({ error: "Отсутствует имя" }); //Поменять статус
    }*/

    models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        result.destroy().then((result2) => {
            return res.status(200).json({ message: 'success' });
        });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}


const approveCreation = async (req, res) => {
    //Временно закоментировано
    /*if (!req.client.is_admin) {
        return res.status(500).json({ error: "Недостаточно привелегий" }); //Поменять статус
    }*/

    //Посмотреть в сторону внесений изменений при принятии

    models.Creations.findOne({ where: { id: req.body.new_record_id } }).then(async (result) => {
        if (result === undefined) {
            return res.status(500).json({ error: "creation does not exist" });
        }
        result.current = true;
        //result.CreationId = req.body.old_record_id;
        result.save().then(() => {
            /*models.Creations.findOne({ where: { id: req.body.old_record_id } }).then(async (second_result) => {
                if (second_result !== undefined) {
                    second_result.current = false;
                    second_result.save();
                }*/
            return res.status(200).json({ message: 'success' });
            //});
        });

    });
};


const getSimilarCreationsOnTagsById = async (req, res) => {
    //Проверки?
    console.log(req.body.creation_id);
    models.Tags.findAll({ include: [{ model: models.Creations, through: 'Creation_Tags', where: { id: req.headers.creation_id } }] }).then((result) => {
        var ids = [];
        for (tag of result) {
            ids.push(tag.id);
        }
        models.Creations.findAll({ include: [{ model: models.Tags, through: "Creation_Tags", where: { id: ids } }] }).then((result2) => {
            const tagMap = new Map();
            for (tagCreation of result2) {
                if (tagCreation.id != req.headers.creation_id && tagCreation.current) {
                    tagMap.set(tagCreation.id, tagCreation.Tags.length);
                }
            }
            console.log(tagMap);
            tagMap[Symbol.iterator] = function* () {
                yield* [...this.entries()].sort((a, b) => -a[1] + b[1]);
            }

            const topRecs = [];
            var topN = 5;
            for (let [key, value] of tagMap) {
                topRecs.push(key);
                topN--;
                console.log(key + ' ' + value);
                if (topN <= 0) {
                    break;
                }
            }

            console.log([...tagMap]);
            /*const resultTopRecs = new Object();
            resultTopRecs.data = topRecs;*/ //Забыл зачем оно написано, пусть полежит
            models.Creations.findAll({ where: { id: topRecs } }).then((result) => {
                return res.json({ result });
            }).catch((err) => {
                return res.status(500).json({ error: err.message })
            });
        });
    }).catch((err) => {
        console.log(err);
        return res.status(500).json({ error: err.message })

    });

}

const getSimilarCreationsOnAuthorsById = async (req, res) => {
    //Можно подправить первый запрос, он ыбл скопирован из другой функции и все что нужно ищет, но можно было б чуть по другому сдлетаь
    models.Roles.findAll({ include: [{ model: models.Authors, through: "Participation" }, { model: models.Creations, through: "Participation", where: { id: req.params.id } }] }).then((result2) => {
        let authors = [];
        for (element of result2) {
            authors.push(element.Authors[0].id);
        }
        models.Creations.findAll({ include: [{ model: models.Authors, through: "Participation", where: { id: authors } }], where: { id: { [Sequelize.Op.not]: req.params.id } } }).then((result) => {
            result.sort((a, b) => (a.dataValues.Authors.length > b.dataValues.Authors.length) ? -1 : (b.dataValues.Authors.length > a.dataValues.Authors.length) ? 1 : 0);
            return res.status(200).json({ result });
        }).catch((error) => {
            return res.status(500).json({ error: error.message });
        });
    }).catch((error) => {
        return res.status(500).json({ error: error.message });
    });

}

const getUnapprovedCreations = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Creations.findAll({ attributes: ['id', 'name', 'CreationTypeId'], where: { current: false }, order: [[req.query.sort_param, req.query.sort_order]] }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message });
    });
}

const getUnapprovedCreationsByUser = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Creations.findAll({ attributes: ['id', 'name', 'CreationTypeId'], where: { current: false, ClientId: req.client.id }, order: [[req.query.sort_param, req.query.sort_order]] }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message });
    });
}

const searchCreations = async (req, res) => {
    if (req.query.string === undefined) {
        req.query.string = "";
    }
    req.query.string += "%";
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    if (req.query.limit === undefined) {
        req.query.limit = 5;
    }
    if (req.query.page === undefined) {
        req.query.page = 1;
    }

    models.Creations.findAll({ attributes: ['id', 'name'], where: { name: { [Op.like]: req.query.string }, current: true }, order: [[req.query.sort_param, req.query.sort_order]], limit: req.query.limit, offset: (req.query.page - 1) * req.query.limit }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message });
    });
}

const getCreationTags = async (req, res) => {
    if (req.params.id === undefined) {
        //Кинуть ошибку
    }

    models.Tags.findAll({ include: [{ model: models.Creations, through: 'Creation_Tags', where: { id: req.params.id } }] }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message });
    });
}

module.exports = {
    addCreationType,
    getAllCreationTypes,
    getCreationById,
    addCreationRecord,
    getAllCreations,
    addTag,
    approveCreation,
    getAllTags,
    getSimilarCreationsOnTagsById,
    getUnapprovedCreations,
    removeCreation,
    searchCreations,
    getCreationTags,
    getSimilarCreationsOnAuthorsById,
    getAllCreationsByUser,
    getUnapprovedCreationsByUser,
}