const { Sequelize } = require('../database/models');
const models = require('../database/models');
const creation = require('../database/models/creation');

const addCreationType = async (req, res) => {
    //И тут проверки думаю появятся, ну хоть какие то(на админа в том числе)
    try {
        const newCreation = await models.Creation_types.create({ name: req.body.name, description: req.body.description });
        console.log(newCreation);
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

const getAllCreationTypes = async (req, res) => {
    //Проверки проверочки не нужны наконец

    models.Creation_types.findAll().then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}

const addCreationRecord = async (req, res) => {
    //Тут будут проверки разные

    models.Creation_types.findOne({ where: { name: req.body.creation_type } }).then(async (result) => {
        try {
            //ПРоверочка
            const newCreation = await models.Creations.create({ name: req.body.name, CreationTypeId: result.id, date_published: req.body.date_published, description: req.body.description, is_approved: false, country: req.body.country, age_rating: req.body.age_rating, ClientId: req.client.id, current: false, date_updated: "2020-01-01 19:20:00" });
            console.log(newCreation);
            for (var tag of req.body.tags) {
                models.Tags.findOne({ where: { name: tag } }).then((result) => {
                    //Проверочка
                    console.log(result);
                    newCreation.addTag(result);
                }).catch((err) => {
                    return res.status(500).json({ error: `error while adding tag: ${err.message}` });
                });
            }
            return res.status(200).json({ message: 'success' });
        } catch (error) {
            return res.status(500).json({ error: error.message })
        }
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

const getCreationById = async (req, res) => {
    models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}

const addTag = async (req, res) => {
    //И тут проверок накину
    try {
        const newCreation = await models.Tags.create({ name: req.body.name, description: req.body.description });
        console.log(newCreation);
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
};

const removeCreation = async (req,res) => {
	//Проверочку на админа надо добавить
	
	models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        result.destroy().then( (result2) => {
			return res.status(200).json({ message: 'success' });
		});
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });

}

const getAllTags = async (req, res) => {
    //Проверки проверочки не нужны наконец

    models.Tags.findAll().then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
    });
}

const approveCreation = async (req, res) => {
    //Точно проверка на админа появится

    //А еще тут трай-кетч появится
	
	//А еще надо добавить возможность внесения изменений админом

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
                if (topN <=0) {
                    break;
                }
            }

            console.log([...tagMap]);
			const resultTopRecs = new Object();
			resultTopRecs.data = topRecs;
			models.Creations.findAll({ where: {id: topRecs}}).then((result) => {
				return res.json({result});
			}).catch((err) => {
			});
            
            //return res.json(resultTopRecs);
        });
    }).catch((err) => {
			console.log(err);

        return res.status(500).json({ error: err.message })

    });

}

const getUnapprovedCreations = async (req, res) => {
	    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Creations.findAll({ attributes: ['id', 'name'], where: { current: false }, order: [[req.query.sort_param, req.query.sort_order]] }).then(async (result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(500).json({ error: err.message })
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
}