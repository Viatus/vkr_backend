const {
    StatusCodes,
} = require('http-status-codes');
const { Sequelize, sequelize } = require('../database/models');
const models = require('../database/models');
const Op = Sequelize.Op;
const fs = require('fs')
const { performance } = require('perf_hooks');
const { addDiscussion } = require('./discussionController');
require('dotenv').config();

currentDistanceMethod = process.env.DEFAULT_DISTANCE_METHOD;
currentRecsMethod = process.env.DEFAULT_RECS_METHOD;
distancesGlobal = {};
matrixGlobal = {};
predictedScoresGlobal = {};

const addCreationType = async (req, res) => {
    if (!req.client.is_admin) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: "Недостаточно привелегий" }); //Поменять статус
    }
    if (req.body.name === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    if (req.body.description === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    try {
        const existingCreationType = await models.Creation_types.findOne({ where: { name: req.body.name } });
        if (existingCreationType === null) {
            const newCreationType = await models.Creation_types.create({ name: req.body.name, description: req.body.description });
            console.log(newCreationType);
            return res.status(StatusCodes.CREATED).json({ newCreationType });
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такой жанр уже сущетсвует" })
        }
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
    }
}

const getAllCreationTypes = async (req, res) => {
    models.Creation_types.findAll().then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
}

const getCreationTypeInfo = async (req, res) => {
    models.Creation_types.findOne({ where: { id: req.params.id } }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
}

const addCreationRecord = async (req, res) => {
    if (req.body.name === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует имя" });
    }
    if (req.body.creation_type === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует жанр" });
    }

    models.Creation_types.findOne({ where: { name: req.body.creation_type } }).then(async (result) => {
        try {
            if (result === undefined) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такого жанра не существует" });
            }
            //ПОПРАВИТЬ ДАТУ !!!!
            const newCreation = await models.Creations.create({ CreationTypeId: result.id, date_published: req.body.date_published, description: req.body.description, country: req.body.country, age_rating: req.body.age_rating, ClientId: req.client.id, current: false, date_updated: "2020-01-01 19:20:00", image_uuid: req.image_uuid });
            console.log(newCreation);
            //req.creation_id = newCreation.id;
            //if (req.body.name !== undefined) {
            await models.Creation_Names.create({ CreationId: newCreation.id, name: req.body.name }).catch((err) => {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            });
            //}
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
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: `error while adding tag: ${err.message}` });
                });
            }
            console.log(newCreation);
            return res.status(StatusCodes.CREATED).json({ newCreation });
        } catch (error) {
            console.log(error.message);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    }).catch((err) => {
        console.log(err.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
};

const getAllNamesForCreation = async (req, res) => {
    if (req.params.id === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует id произведения" });
    }

    models.Creation_Names.findAll({ where: { CreationId: req.params.id } }).then((result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
};

const addNameToCreation = async (req, res) => {
    if (req.params.id === undefined || req.body.name === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует id или новое имя произведения" });
    }

    models.Creation_Names.findAll({ where: { CreationId: req.params.id, name: req.body.name } }).then((result) => {
        /*if (result != []) {
            console.log(result);
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такое имя уже добавлено" });
        }*/
        models.Creation_Names.create({ CreationId: req.params.id, name: req.body.name }).then((newName) => {
            return res.status(StatusCodes.CREATED).json({ newName });
        }).catch((err) => {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
};

const getAllCreations = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }

    //С сортировкой бы что то сделать
    models.Creations.findAll({ attributes: ['id', 'CreationTypeId'], include: [{ model: models.Creation_Names, attributes: ['name'] }], where: { current: true }/*, order: [[req.query.sort_param, req.query.sort_order]]*/ }).then(async (result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });

};

const getAllCreationsByUser = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    models.Creations.findAll({ attributes: ['id', 'CreationTypeId'], include: [{ model: models.Creation_Names, attributes: ['name'] }], where: { current: true, ClientId: req.client.id }/*, order: [[req.query.sort_param, req.query.sort_order]]*/ }).then(async (result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });

};

const getCreationById = async (req, res) => {
    models.Creations.findOne({ where: { id: req.params.id }, include: [{ model: models.Creation_Names, attributes: ['name'] }] }).then(async (result) => {
        models.Reviews.findAll({ where: { CreationId: req.params.id }, attributes: ["score"] }).then((result2) => {
            const amount = result2.length;
            var sum = 0;
            for (var i = 0; i < amount; i++) {
                sum += result2[i].score;
            }
            const avg = sum / amount;
            result.dataValues.rating = avg;
            const file = `${__dirname}/../covers/${result.dataValues.image_uuid}.jpg`;
            try {
                result.dataValues.image = fs.readFileSync(file, 'base64');
            } catch (err) {
            }
            return res.status(StatusCodes.OK).json({ result });
        }).catch((err) => {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
        });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
}

const addTag = async (req, res) => {
    if (req.body.name === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует имя" });
    }
    if (req.body.description === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует описание" });
    }
    try {
        const existingTag = await models.Tags.findOne({ where: { name: req.body.name } });
        if (existingTag === null) {
            const newTag = await models.Tags.create({ name: req.body.name, description: req.body.description });
            console.log(newTag);
            return res.status(StatusCodes.CREATED).json({ newTag });
        }
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такой тэг уже существует" })

    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
    }
};

const getAllTags = async (req, res) => {
    models.Tags.findAll().then((result) => {
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
}


const removeCreation = async (req, res) => {
    //Временно закомментировано
    if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Недостаточно прав" });
    }

    models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        result.destroy().then((result2) => {
            return res.status(StatusCodes.OK).json({ message: 'success' });
        });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
}


const approveCreation = async (req, res) => {
    if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Недостаточно привелегий" });
    }

    models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        if (result === undefined) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такого произведения не существует" });
        }
        if (req.body.description !== undefined) {
            result.description = req.body.description;
        }
        if (req.body.age_rating !== undefined) {
            result.age_rating = req.body.age_rating;
        }
        if (req.body.date_published !== undefined) {
            result.date_published = req.body.date_published;
        }
        if (req.body.country !== undefined) {
            result.country = req.body.country;
        }
        result.current = true;
        //result.CreationId = req.body.old_record_id;
        result.save().then(() => {
            /*models.Creations.findOne({ where: { id: req.body.old_record_id } }).then(async (second_result) => {
                if (second_result !== undefined) {
                    second_result.current = false;
                    second_result.save();
                }*/
            req.body.CreationId = result.dataValues.id;
            req.body.title = "Обсуждение произведения";
            req.body.content = "Понравилось ли вам данное произведение? Что вы о нем думаете?";
            addDiscussion(req).then(() => {

            });
            return res.status(StatusCodes.OK).json({ result });
            //});
        }).catch((err) => {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
};


//Еще раз сюда посмотреть
const getSimilarCreationsOnTagsById = async (req, res) => {
    //Проверки?
    models.Tags.findAll({ include: [{ model: models.Creations, through: 'Creation_Tags', where: { id: req.params.id } }] }).then((result) => {
        var ids = [];
        for (tag of result) {
            ids.push(tag.id);
        }
        //Не забыть проверить работает ли оно вообще(вроде работает?)
        models.Creations.findAll({ include: [{ model: models.Tags, through: "Creation_Tags", where: { id: ids } }, { model: models.Creation_Names, attributes: ['name'] }] }).then((result2) => {
            const tagMap = new Map();
            for (tagCreation of result2) {
                if (tagCreation.id != req.params.id && tagCreation.current) {
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
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
            });
        });
    }).catch((err) => {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });

}

const getSimilarCreationsOnAuthorsById = async (req, res) => {
    //Можно подправить первый запрос, он ыбл скопирован из другой функции и все что нужно ищет, но можно было б чуть по другому сдлетаь
    models.Roles.findAll({ include: [{ model: models.Authors, through: "Participation" }, { model: models.Creations, through: "Participation", where: { id: req.params.id } }] }).then((result2) => {
        let authors = [];
        for (element of result2) {
            authors.push(element.Authors[0].id);
        }
        //Тоже проверить не убилось ли оно
        models.Creations.findAll({ include: [{ model: models.Authors, through: "Participation", where: { id: authors } }, { model: models.Creation_Names, attributes: ['name'] }], where: { id: { [Sequelize.Op.not]: req.params.id } } }).then((result) => {
            result.sort((a, b) => (a.dataValues.Authors.length > b.dataValues.Authors.length) ? -1 : (b.dataValues.Authors.length > a.dataValues.Authors.length) ? 1 : 0);
            return res.status(StatusCodes.OK).json({ result });
        }).catch((error) => {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        });
    }).catch((error) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    });

}

const getPredictedScoreForCreation = async (req, res) => {
    for (score of predictedScoresGlobal[req.client.id]) {
        if (score[0] == req.params.id) {
            return res.status(StatusCodes.OK).json({ result: score[1] });
        }
    }
    return res.status(StatusCodes.NOT_FOUND);
}

const getUnapprovedCreations = async (req, res) => {
    if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Недостаточно привелегий" });
    }

    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    //Оживить сортировку
    models.Creations.findAll({ attributes: ['id', 'CreationTypeId'], include: [{ model: models.Creation_Names, attributes: ['name'] }], where: { current: false }/*, order: [[req.query.sort_param, req.query.sort_order]]*/ }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getUnapprovedCreationsByUser = async (req, res) => {
    if (req.query.sort_order === undefined) {
        req.query.sort_order = 'ASC';
    }
    if (req.query.sort_param === undefined) {
        req.query.sort_param = 'name';
    }
    //Оживить сортировку
    models.Creations.findAll({ attributes: ['id', 'CreationTypeId'], include: [{ model: models.Creation_Names, attributes: ['name'] }], where: { current: false, ClientId: req.client.id }, /*order: [[req.query.sort_param, req.query.sort_order]]*/ }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const searchCreations = async (req, res) => {
    if (req.query.string === undefined) {
        req.query.string = "%";
    } else {
        req.query.string = "%" + req.query.string.toLowerCase() + "%";
    }
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
    //Сортировку оживить
    models.Creations.findAll({ attributes: ['id'], include: [{ model: models.Creation_Names, attributes: ['name'], where: { name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', req.query.string) } }], where: { current: true }, /*order: [[req.query.sort_param, req.query.sort_order]],*/ limit: req.query.limit, offset: (req.query.page - 1) * req.query.limit }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getCreationTags = async (req, res) => {
    if (req.params.id === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id тэга' });
    }

    models.Tags.findAll({ include: [{ model: models.Creations, through: 'Creation_Tags', where: { id: req.params.id } }] }).then((result) => {
        return res.json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const addUserRecommendation = async (req, res) => {
    if (req.body.firstCreationId === undefined || req.body.secondCreationId === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id первого или второго произведения' });
    }
    models.UserRecommendations.create({ firstCreationId: req.body.firstCreationId, secondCreationId: req.body.secondCreationId, ClientId: req.client.id, content: req.body.content }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.CREATED).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getUserRecommendationsForCreation = async (req, res) => {
    models.UserRecommendations.findAll({ where: { [Sequelize.Op.or]: [{ firstCreationId: req.params.id }, { secondCreationId: req.params.id }] } }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const addCreationRelation = async (req, res) => {
    if (req.body.firstCreationId === undefined || req.body.secondCreationId === undefined || req.body.firstCreationStanding === undefined || req.body.secondCreationStanding === undefined) {
        console.log(req.body);
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Отстутствует id первого или второго произведения или описание их отношений' });
    }
    models.CreationRelations.create({ firstCreationId: req.body.firstCreationId, secondCreationId: req.body.secondCreationId, firstCreationStanding: req.body.firstCreationStanding, secondCreationStanding: req.body.secondCreationStanding }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.CREATED).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getCreationRelationsForCreation = async (req, res) => {
    models.CreationRelations.findAll({ where: { [Sequelize.Op.or]: [{ firstCreationId: req.params.id }, { secondCreationId: req.params.id }] } }).then((result) => {
        console.log(result);
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

const getRecommendationsForUser = async (req, res) => {
    if (req.query.rating_treshold === undefined) {
        req.query.rating_treshold = 0;
    }
    if (req.query.similar_critics_max_number === undefined) {
        req.query.similar_critics_max_number = 10;
    }
    if (req.query.recommeded_creations_max_number === undefined) {
        req.query.recommeded_creations_max_number = 10;
    }
    if (req.query.recommendation_method_code === undefined) {
        req.query.recommendation_method_code = 3;
    }

    if (distancesGlobal == {}) {
        return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Рекоммендации еще не готовы" });
    }

    let ratings = calculateRecommendedCreations(distancesGlobal, matrixGlobal, req.client.id, req.query.similar_critics_max_number, req.query.recommeded_creations_max_number, req.query.rating_treshold, req.query.recommendation_method_code);
    console.log(ratings);
    var ids = [];
    for (rating of ratings) {
        ids.push(rating[0]);
    }
    //В этом случае теряется порядок и нет ожидаемой оценки(она вроде особо и не нужна, а вот порядок было бы неплохо сохранять)
    models.Creations.findAll({ where: { id: ids }, include: [{ model: models.Creation_Names, attributes: ['name'] }] }).then((result) => {
        for (cr of result) {
            for (rating of ratings) {
                if (cr.dataValues.id == rating[0]) {
                    cr.dataValues.predicted_rating = rating[1];
                }
            }
        }
        return res.status(StatusCodes.OK).json({ result });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

callCalculateDistances = function () {
    models.Creations.findAll({ where: { current: true }, attributes: ['id'] }).then((creations) => {
        models.Clients.findAll({ include: [{ model: models.Reviews, attributes: ['CreationId', 'score'] }], attributes: ['id'] }).then((clients) => {
            var matrix = {};
            for (cl of clients) {
                var clientReviews = {};
                for (rev of cl.Reviews) {
                    let crId = rev.dataValues.CreationId;
                    let score = rev.dataValues.score;
                    clientReviews[crId] = score;
                }
                /*for (creation of creations) {
                    let crId = creation.dataValues.id;
                    if (!reviewedCreations.includes(crId)) {
                        clientReviews[crId] = 0;
                    }
                }*/
                matrix[cl.dataValues.id] = clientReviews;
            }
            matrixGlobal = matrix;
            distancesGlobal = calculateDistances(matrix, currentDistanceMethod);
            console.log("distances recalculated");
            for (cl of clients) {
                let predictedScores = calculateRecommendedCreations(distancesGlobal, matrixGlobal, cl.dataValues.id, 10, Number.MAX_VALUE, 0, currentRecsMethod);
                predictedScoresGlobal[cl.dataValues.id] = predictedScores;
            }
            setTimeout(callCalculateDistances, 1000 * process.env.RECOMMENDATION_INTERVAL);
        })
    });
}

//1 - euclidean distance
//2 - PCC
//3 - constrained PCC
//4 - Sigmoid function-based PCC
//5 - cosine method
//6 - Jaccard
//7 - Jaccard and mean squared difference measure
//8 - NUSCCF method
//9 - BCF - пока не робит
//10 - BCF + JACC - пока не робит
const calculateDistances = function (dataset, methodCode) {

    //console.log(dataset);
    var distances = {};
    for (user in dataset) {
        distances[user] = {};
    }

    //Euclidean distance
    if (methodCode == 1) {
        for (firstUser in dataset) {
            distances[firstUser][firstUser] = -1;
            for (secondUser in dataset) {
                if (firstUser == secondUser) {
                    continue;
                }
                if (distances[firstUser][secondUser] === undefined) {
                    var distanceToSecondUser = 0;
                    for (creation in dataset[firstUser]) {
                        if (dataset[secondUser][creation] !== undefined) {
                            distanceToSecondUser += Math.pow(dataset[firstUser][creation] - dataset[secondUser][creation], 2);
                        }
                    }
                    distanceToSecondUser = Math.sqrt(distanceToSecondUser);
                    distances[firstUser][secondUser] = distanceToSecondUser;
                    distances[secondUser][firstUser] = distanceToSecondUser;
                }
            }
        }
    }

    //PCC(2) and constrained PCC (3) and Sigmoid PCC(4)
    if (methodCode == 2 || methodCode == 3 || methodCode == 4) {
        var I = 0;
        if (methodCode == 4) {
            let uniqueCreations = [];
            for (user in dataset) {
                for (creation in dataset[user]) {
                    if (!uniqueCreations.includes(creation)) {
                        uniqueCreations.push(creation);
                    }
                }
            }
            I = uniqueCreations.length;
        }
        for (firstUser in dataset) {
            distances[firstUser][firstUser] = -1;
            for (secondUser in dataset) {
                if (distances[firstUser][secondUser] === undefined) {
                    //average user score
                    const reducer = (accumulator, currentValue) => accumulator + currentValue;
                    var firstUserAvg, secondUserAvg;
                    if (methodCode == 2 || methodCode == 4) {
                        firstUserAvg = Object.values(dataset[firstUser]).reduce(reducer) / Object.keys(dataset[firstUser]).length;
                        secondUserAvg = Object.values(dataset[secondUser]).reduce(reducer) / Object.keys(dataset[secondUser]).length;
                    } else {
                        if (methodCode == 3) {
                            firstUserAvg = 2.5;
                            secondUserAvg = 2.5;
                        }
                    }

                    var upperSum = 0;
                    var firstLowerSum = 0;
                    var secondLowerSum = 0;
                    for (creation in dataset[firstUser]) {
                        if (dataset[secondUser][creation] !== undefined) {
                            upperSum += (dataset[firstUser][creation] - firstUserAvg) * (dataset[secondUser][creation] - secondUserAvg);
                            firstLowerSum += Math.pow(dataset[firstUser][creation] - firstUserAvg, 2);
                            secondLowerSum += Math.pow(dataset[secondUser][creation] - secondUserAvg, 2);
                        }
                    }
                    var distanceBetweenUsers = upperSum / (Math.sqrt(firstLowerSum) * Math.sqrt(secondLowerSum));
                    if (methodCode == 4) {
                        distanceBetweenUsers = distanceBetweenUsers * (1 / (1 + Math.exp(-I / 2)));
                    }
                    distances[firstUser][secondUser] = distanceBetweenUsers;
                    distances[secondUser][firstUser] = distanceBetweenUsers;
                }
            }
        }
    }

    //Cosine method
    if (methodCode == 5) {
        for (firstUser in dataset) {
            distances[firstUser][firstUser] = -1;
            for (secondUser in dataset) {
                if (distances[firstUser][secondUser] === undefined) {
                    var upperSum = 0;
                    var firstLowerSum = 0;
                    var secondLowerSum = 0;
                    for (creation in dataset[firstUser]) {
                        if (dataset[secondUser][creation] !== undefined) {
                            upperSum += dataset[firstUser][creation] * dataset[secondUser][creation];
                            firstLowerSum += Math.pow(dataset[firstUser][creation], 2);
                            secondLowerSum += Math.pow(dataset[secondUser][creation], 2);
                        }
                    }
                    let distanceBetweenUsers = upperSum / (Math.sqrt(firstLowerSum) * Math.sqrt(secondLowerSum));
                    distances[firstUser][secondUser] = distanceBetweenUsers;
                    distances[secondUser][firstUser] = distanceBetweenUsers;
                }
            }
        }
    }

    //Jaccard(6) and Jaccard and mean squared difference measure(7)
    if (methodCode == 6 || methodCode == 7 || methodCode == 10) {
        for (firstUser in dataset) {
            distances[firstUser][firstUser] = -1;
            for (secondUser in dataset) {
                if (distances[firstUser][secondUser] === undefined) {
                    var numberOfBothRated = 0;
                    var numberOfRated = 0;
                    var sumOfRatingDiffs = 0;
                    for (firstUserCreation in dataset[firstUser]) {
                        if (dataset[secondUser][firstUserCreation] !== undefined) {
                            numberOfBothRated++;
                            sumOfRatingDiffs += Math.pow(dataset[firstUser][firstUserCreation] - dataset[secondUser][firstUserCreation], 2);
                        }
                        numberOfRated++;
                    }
                    for (secondUserCreation in dataset[secondUser]) {
                        if (dataset[firstUser][secondUserCreation] === undefined) {
                            numberOfRated++;
                        }
                    }
                }
                var distanceBetweenUsers = numberOfBothRated / numberOfRated;
                if (methodCode == 7) {
                    distanceBetweenUsers *= (1 - sumOfRatingDiffs / numberOfRated);
                }
                distances[firstUser][secondUser] = distanceBetweenUsers;
                distances[secondUser][firstUser] = distanceBetweenUsers;
            }
        }
    }

    if (methodCode == 8) {
        //Constructing item lists
        let interestedList = {};
        let niuList = {};
        let uninterestedList = {};
        for (user in dataset) {
            interestedList[user] = [];
            niuList[user] = [];
            uninterestedList[user] = [];
            for (creation in dataset[user]) {
                if (dataset[user][creation] >= 4 && dataset[user][creation] <= 5) {
                    interestedList[user].push(creation);
                }
                if (dataset[user][creation] >= 3 && dataset[user][creation] <= 3) {
                    niuList[user].push(creation);
                }
                if (dataset[user][creation] >= 0 && dataset[user][creation] <= 2) {
                    uninterestedList[user].push(creation);
                }
            }
        }

        //Constructing items subspaces
        var interestedSubspaces = [];
        //var niuSubspaces = [];
        //var uninterestedSubspaces = [];

        let users = Object.keys(dataset);
        for (var i = 0; i < users.length; i++) {
            for (var j = i + 1; j < users.length; j++) {
                var intersection = interestedList[users[i]].filter(x => interestedList[users[j]].includes(x));
                if (intersection.length > 0) {
                    var isNew = true;
                    /*for (interestedSubspace of interestedSubspaces) {
                        if (interestedSubspace.length >= intersection.length) {
                            if (intersection.every((element) => interestedSubspace.includes(element))) {
                                isNew = false;
                                break;
                            }
                        }
                    }
                    if (isNew) {*/
                    interestedSubspaces.push(intersection);
                    //}
                }
                /*intersection = niuList[users[i]].filter(x => niuList[users[j]].includes(x));
                if (intersection.length > 0) {
                    var isNew = true;
                    for (niuSubspace of niuSubspaces) {
                        if (intersection.every((element) => niuSubspaces.includes(element))) {
                            isNew = false;
                            break;
                        }
                    }
                    if (isNew) {
                        niuSubspaces.push(intersection);
                    }
                }
                intersection = uninterestedList[users[i]].filter(x => uninterestedList[users[j]].includes(x));
                if (intersection.length > 0) {
                    var isNew = true;
                    for (uninterestedSubspace of uninterestedSubspaces) {
                        if (intersection.every((element) => uninterestedSubspaces.includes(element))) {
                            isNew = false;
                            break;
                        }
                    }
                    if (isNew) {
                        uninterestedSubspaces.push(intersection);
                    }
                }*/
            }
        }

        //Removing redundancy
        interestedSubspaces.sort(function (a, b) {
            return b.length - a.length;
        });
        /*niuSubspaces.sort(function (a, b) {
            return b.length - a.length;
        });
        uninterestedSubspaces.sort(function (a, b) {
            return b.length - a.length;
        });*/

        let initialInterestedSubspacesLength = interestedSubspaces.length
        for (var i = 0; i < initialInterestedSubspacesLength; i++) {
            let currentLength = interestedSubspaces.length;
            if (i >= currentLength) {
                break;
            }
            for (var j = i + 1; j < currentLength; j++) {
                if (j >= interestedSubspaces.length) {
                    break;
                }
                if (interestedSubspaces[j].every((element) => interestedSubspaces[i].includes(element))) {
                    interestedSubspaces.splice(j, 1);
                }
            }
        }
        console.log(interestedSubspaces.length);

        //Finding Neighbor users
        let neighborUsersInterested = [];
        for (subspace of interestedSubspaces) {
            let subspaceNeighbours = [];
            for (user in dataset) {
                if (subspace.every((element) => dataset[user][element] >= 4 && dataset[user][element] <= 5)) {
                    subspaceNeighbours.push(user);
                }
            }
            neighborUsersInterested.push(subspaceNeighbours);
        }

        //Building user trees
        let userTreeInterested = constructUserTree(dataset, neighborUsersInterested);

        //Calculating distances
        for (firstUser in dataset) {
            //Верхний уровень считается по PCC
            var wSum = {};
            var lwSum = {};
            for (secondUser in userTreeInterested[firstUser]) {
                if (distances[firstUser][secondUser] === undefined) {
                    const reducer = (accumulator, currentValue) => accumulator + currentValue;
                    let firstUserAvg = Object.values(dataset[firstUser]).reduce(reducer) / Object.keys(dataset[firstUser]).length;
                    let secondUserAvg = Object.values(dataset[secondUser]).reduce(reducer) / Object.keys(dataset[secondUser]).length;
                    var upperSum = 0;
                    var firstLowerSum = 0;
                    var secondLowerSum = 0;
                    for (creation in dataset[firstUser]) {
                        if (dataset[secondUser][creation] !== undefined) {
                            upperSum += (dataset[firstUser][creation] - firstUserAvg) * (dataset[secondUser][creation] - secondUserAvg);
                            firstLowerSum += Math.pow(dataset[firstUser][creation] - firstUserAvg, 2);
                            secondLowerSum += Math.pow(dataset[secondUser][creation] - secondUserAvg, 2);
                        }
                    }
                    let distanceBetweenUsers = upperSum / (Math.sqrt(firstLowerSum) * Math.sqrt(secondLowerSum));
                    distances[firstUser][secondUser] = distanceBetweenUsers;
                    distances[secondUser][firstUser] = distanceBetweenUsers;

                    //Для нижнего уровня используются более хитрые формулы
                    for (thirdUser of userTreeInterested[firstUser][secondUser]) {
                        var numberOfBothRated = 0;
                        var numberOfRated = 0;
                        var sumOfRatingDiffs = 0;
                        for (firstUserCreation in dataset[firstUser]) {
                            if (dataset[secondUser][firstUserCreation] !== undefined) {
                                numberOfBothRated++;
                                sumOfRatingDiffs += Math.pow(dataset[firstUser][firstUserCreation] - dataset[secondUser][firstUserCreation], 2);
                            }
                            numberOfRated++;
                        }
                        for (secondUserCreation in dataset[secondUser]) {
                            if (dataset[firstUser][secondUserCreation] === undefined) {
                                numberOfRated++;
                            }
                        }
                        var l = 2 * numberOfBothRated / numberOfRated;
                        var w = 1 - sumOfRatingDiffs / (2 * numberOfBothRated);
                        lwSum[thirdUser] += l * w;
                        wSum[thirdUser] += w;

                        for (firstUserCreation in dataset[secondUser]) {
                            if (dataset[secondUser][firstUserCreation] !== undefined) {
                                numberOfBothRated++;
                                sumOfRatingDiffs += Math.pow(dataset[secondUser][firstUserCreation] - dataset[secondUser][firstUserCreation], 2);
                            }
                            numberOfRated++;
                        }
                        for (secondUserCreation in dataset[thirdUser]) {
                            if (dataset[secondUser][secondUserCreation] === undefined) {
                                numberOfRated++;
                            }
                        }
                        var l = 2 * numberOfBothRated / numberOfRated;
                        var w = 1 - sumOfRatingDiffs / (2 * numberOfBothRated);
                        lwSum[thirdUser] += l * w;
                        wSum[thirdUser] += w;
                    }
                }
            }
            for (thirdUser in wSum) {
                let distanceBetweenUsers = lwSum[thirdUser] / wSum[thirdUser];
                distances[firstUser][thirdUser] = distanceBetweenUsers;
                distances[thirdUser][firstUser] = distanceBetweenUsers;
            }
        }
    }

    if (methodCode == 9 || methodCode == 10) {
        let bc = {};
        let uniqueCreations = [];
        for (user in dataset) {
            for (creation in dataset[user]) {
                if (!uniqueCreations.includes(creation)) {
                    uniqueCreations.push(creation);
                }
            }
        }

        //Calculating BC
        for (firstCreation of uniqueCreations) {
            if (bc[firstCreation] === undefined) {
                bc[firstCreation] = {};
            }
            for (secondCreation of uniqueCreations) {
                if (bc[secondCreation] === undefined) {
                    bc[secondCreation] = {};
                }
                if (bc[firstCreation][secondCreation] === undefined) {
                    var firstTotalVotes = 0;
                    var secondTotalVotes = 0;
                    var firstH = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    var secondH = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    for (user in dataset) {
                        if (dataset[user][firstCreation] !== undefined) {
                            firstTotalVotes++;
                            for (key of Object.keys(firstH)) {
                                if (dataset[user][firstCreation] == key) {
                                    firstH[key]++;
                                }
                            }
                        }
                        if (dataset[user][secondCreation] !== undefined) {
                            secondTotalVotes++;
                            for (key of Object.keys(secondH)) {
                                if (dataset[user][secondCreation] == key) {
                                    secondH[key]++;
                                }
                            }
                        }
                    }
                    var bcSum = 0;
                    for (key of Object.keys(firstH)) {
                        bcSum += Math.sqrt((firstH[key] / firstTotalVotes) * (secondH[key] / secondTotalVotes));
                    }
                    bc[firstCreation][secondCreation] = bcSum;
                    bc[secondCreation][firstCreation] = bcSum;
                }
            }
        }

        //Calculating loc
        let squareMedDifferences = {};
        for (user in dataset) {
            var squareSum = 0;
            for (creation in dataset[user]) {
                squareSum += Math.pow(dataset[user][creation] - 3, 2);
            }
            squareMedDifferences[user] = Math.sqrt(squareSum);
        }

        let distancesBCF = {};

        for (firstUser in dataset) {
            if (distancesBCF[firstUser] === undefined) {
                distancesBCF[firstUser] = {};
            }
            for (secondUser in dataset) {
                if (distancesBCF[secondUser] === undefined) {
                    distancesBCF[secondUser] = {};
                }
                if (distancesBCF[firstUser][secondUser] === undefined) {
                    var similarity = 0;
                    for (firstCreation of uniqueCreations) {
                        for (secondCreation of uniqueCreations) {
                            if (dataset[firstUser][firstCreation] === undefined) {
                                dataset[firstUser][firstCreation] = 0;
                            }
                            if (dataset[secondUser][secondCreation] === undefined) {
                                dataset[secondUser][secondCreation] = 0;
                            }
                            //if (dataset[firstUser][firstCreation] !== undefined && dataset[secondUser][secondCreation] !== undefined) {
                            let loc = (dataset[firstUser][firstCreation] - 3) * (dataset[secondUser][secondCreation] - 3) / squareMedDifferences[firstUser] / squareMedDifferences[secondUser];
                            similarity += bc[firstCreation][secondCreation] * loc;
                            //}
                        }
                    }
                    distancesBCF[firstUser][secondUser] = similarity;
                    distancesBCF[secondUser][firstUser] = similarity;
                }
            }
        }
        if (methodCode == 9) {
            distances = distancesBCF;
        } else {
            for (firstIndex in distances) {
                for (secondIndex in distances) {
                    distances[firstIndex][secondIndex] += distancesBCF[firstIndex][secondIndex];
                }
            }
        }
    }

    return distances;
}

const constructUserTree = function (dataset, neighbourUsers) {
    let userTree = {};
    for (user in dataset) {
        if (userTree[user] === undefined) {
            userTree[user] = {};
            for (neighbours of neighbourUsers) {
                if (neighbours.includes(user)) {
                    for (neighbour of neighbours) {
                        if (userTree[user][neighbour] === undefined && neighbour != user) {
                            userTree[user][neighbour] = [];
                        }
                    }
                }
            }
        }
        for (secondLevelUser in userTree[user]) {
            if (userTree[secondLevelUser] === undefined) {
                userTree[secondLevelUser] = {};
                for (neighbours of neighbourUsers) {
                    if (neighbours.includes(secondLevelUser)) {
                        for (neighbour of neighbours) {
                            if (userTree[secondLevelUser][neighbour] === undefined && neighbour != secondLevelUser) {
                                userTree[secondLevelUser][neighbour] = [];
                            }
                        }
                    }
                }
            }
            let firstLevelUsers = Object.keys(userTree[user]);
            for (key of Object.keys(userTree[secondLevelUser])) {
                if (!firstLevelUsers.includes(key) && key != user) {
                    userTree[user][secondLevelUser].push(key);
                }
            }
        }
    }
    return userTree;
}

//1 - Average method
//2 - Weighted sum method
//3 - Adjusted weighted method
//4 - TOPSIS method
const calculateRecommendedCreations = function (distances, dataset, userId, numberOfCritics, numberOfRecs, boundaryRating, methodCode, isUsingRelated) {
    let critics = [];
    for (var user in distances[userId]) {
        if (user != userId) {
            if (distances[userId][user] !== undefined) {
                if (distances[userId][user] >= 0) {
                    critics.push([user, distances[userId][user]]);
                }
            }
        }
    }
    critics.sort(function (a, b) {
        return b[1] - a[1];
    });
    critics = critics.slice(0, numberOfCritics);
    //console.log(critics);

    let recCandidates = [];
    for (critic of critics) {
        for (creation of Object.keys(dataset[critic[0]])) {
            if (!recCandidates.includes(creation) && !Object.keys(dataset[userId]).includes(creation)) {
                recCandidates.push(creation);
            }
        }
    }
    //console.log(recCandidates);

    let ratings = [];
    var avgRatings = {};
    var avgSquareRatings = {};
    var userAvgRating;
    if (methodCode == 3 || methodCode == 4) {
        for (critic of critics) {
            var ratingSum = 0;
            for (creation in dataset[critic[0]]) {
                if (methodCode == 3) {
                    ratingSum += dataset[critic[0]][creation];
                } else {
                    ratingSum += Math.pow(dataset[critic[0]][creation], 2);
                }
            }
            avgRatings[critic[0]] = ratingSum / Object.keys(dataset[critic[0]]).length;
            avgSquareRatings[critic[0]] = Math.sqrt(ratingSum);
        }
        var ratingSum = 0;
        for (creation in dataset[userId]) {
            ratingSum += dataset[userId][creation];
        }
        userAvgRating = ratingSum / Object.keys(dataset[userId]).length;
    }
    if (methodCode == 1 || methodCode == 2 || methodCode == 3) {
        for (candidate of recCandidates) {
            //Average method
            if (methodCode == 1) {
                var totalRating = 0;
                var criticsAmount = 0;
                for (critic of critics) {
                    if (dataset[critic[0]][candidate] !== undefined) {
                        totalRating += dataset[critic[0]][candidate];
                        criticsAmount++;
                    }
                }
                if (totalRating / criticsAmount > boundaryRating) {
                    ratings.push([candidate, totalRating / criticsAmount]);
                }
            }
            if (methodCode == 2) {
                var simSum = 0;
                var totalRating = 0;
                for (critic of critics) {
                    if (dataset[critic[0]][candidate] !== undefined) {
                        simSum += critic[1];
                        totalRating += critic[1] * dataset[critic[0]][candidate];
                    }
                }
                //Чтобы не рекомендовать то, на что шансов нет. Можно выставить как порог
                if (totalRating / simSum > boundaryRating) {
                    ratings.push([candidate, totalRating / simSum]);
                }
            }
            if (methodCode == 3) {
                var topSum = 0;
                var botSum = 0;
                for (critic of critics) {
                    if (dataset[critic[0]][candidate] !== undefined) {
                        topSum += critic[1] * (dataset[critic[0]][candidate] - avgRatings[critic[0]]);
                        botSum += critic[1];
                    }
                }

                let totalRating = userAvgRating + topSum / botSum;
                //console.log(totalRating);
                if (totalRating > boundaryRating) {
                    ratings.push([candidate, totalRating]);
                }
            }
        }
    }

    //TOPSIS method
    if (methodCode == 4) {
        //Constructed weighted nominalized decision matrix
        const decisionsMatrix = {};
        for (candidate of recCandidates) {
            if (decisionsMatrix[candidate] === undefined) {
                decisionsMatrix[candidate] = {};
            }
            for (critic of critics) {
                if (dataset[critic[0]][candidate] !== undefined) {
                    decisionsMatrix[candidate][critic[0]] = dataset[critic[0]][candidate] / avgSquareRatings[critic[0]] * critic[1];
                } else {
                    decisionsMatrix[candidate][critic[0]] = avgRatings[critic[0]] / avgSquareRatings[critic[0]] * critic[1];
                }
            }
        }
        //console.log(decisionMatrix['2']);

        //Determine positive and negative ideal solutions(мб идеальное это максимальная похожесть и максимальный рейтинг, а негативное наоборот?)
        let solutions = { ideal: {}, negativeIdeal: {} };
        var avgSimilarity = 0;
        for (critic of critics) {
            avgSimilarity += critic[1];
        }
        avgSimilarity /= critics.length;
        for (candidate of recCandidates) {
            var maxSolution = 0;
            var minSolution = Number.MAX_VALUE;
            for (critic of critics) {
                if (decisionsMatrix[candidate][critic[0]] !== undefined) {
                    if (decisionsMatrix[candidate][critic[0]] > maxSolution && critic[1] >= avgSimilarity) {
                        maxSolution = decisionsMatrix[candidate][critic[0]];
                    }
                    if (decisionsMatrix[candidate][critic[0]] < minSolution && critic[1] < avgSimilarity) {
                        minSolution = decisionsMatrix[candidate][critic[0]];
                    }
                }
            }
            solutions.ideal[candidate] = maxSolution;
            solutions.negativeIdeal[candidate] = minSolution;
        }
        /*for (candidate of recCandidates) {
            var minSim = Number.MAX_VALUE;
            var maxSimCritic = '';
            var maxSim = 0;
            var minSimCritic = '';
            for (critic of critics) {
                if (decisionsMatrix[critic[0]][candidate] !== undefined) {
                    if (critic[1] >= maxSim) {
                        maxSimCritic = critic[0];
                        maxSim = critic[1];
                    }
                    if (critic[1] <= minSim) {
                        minSimCritic = critic[0];
                        minSim = critic[1];
                    }
                }
            }
            solutions.ideal[candidate] = decisionsMatrix[candidate][maxSimCritic];
            solutions.negativeIdeal[candidate] = decisionsMatrix[candidate][minSimCritic];
        }*/
        //console.log(solutions);

        //Calculate separation measure
        for (candidate of recCandidates) {
            var sIdeal = 0;
            var sNegativeIdeal = 0;
            for (critic of critics) {
                if (decisionsMatrix[candidate][critic[0]] !== undefined) {
                    sIdeal += Math.pow(decisionsMatrix[candidate][critic[0]] - solutions.ideal[candidate], 2);
                    sNegativeIdeal += Math.pow(decisionsMatrix[candidate][critic[0]] - solutions.negativeIdeal[candidate], 2);
                }
            }
            sIdeal = Math.sqrt(sIdeal);
            sNegativeIdeal = Math.sqrt(sNegativeIdeal);
            //Calculate the relative closeess to the ideal solution
            ratings.push([candidate, sNegativeIdeal / (sIdeal + sNegativeIdeal)]);
        }
    }

    ratings.sort(function (a, b) {
        return b[1] - a[1];
    });
    ratings = ratings.slice(0, numberOfRecs);
    return ratings;
}

const changeCalculateDistanceMethod = async (req, res) => {
    if (req.client.is_admin) {
        if (req.body.method_code !== undefined) {
            currentDistanceMethod = req.body.method_code;
        }
    }
}

const executeSingleSample = function (baseFile, testFile, outputFile, distanceMethodCode, recMethodCode, amountOfNeighbours, amountOfRecs) {
    fs.readFile(baseFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        var splitData = data.split("\n");
        //splitData = splitData.slice(0, 5000);
        let matrix = {};
        for (line of splitData) {
            if (line != "") {
                let splitLine = line.split("\t");
                if (matrix[splitLine[0]] === undefined) {
                    matrix[splitLine[0]] = {};
                }
                matrix[splitLine[0]][splitLine[1]] = parseInt(splitLine[2], 10);
            }
        }
        let tBeforeClaculateDistances = performance.now();
        let distances = calculateDistances(matrix, distanceMethodCode);
        let calculateDistancesExecutionTime = performance.now() - tBeforeClaculateDistances;
        //console.log(distances);
        fs.readFile(testFile, 'utf8', (err, dataTest) => {
            if (err) {
                console.error(err)
                return
            }
            var splitDataTest = dataTest.split("\n");
            //splitData = splitData.slice(0, 200);
            let matrixTest = {};
            for (line of splitDataTest) {
                if (line != "") {
                    let splitLine = line.split("\t");
                    if (matrixTest[splitLine[0]] === undefined) {
                        matrixTest[splitLine[0]] = {};
                    }
                    matrixTest[splitLine[0]][splitLine[1]] = parseInt(splitLine[2], 10);
                }
            }
            //Далее считается так: если оценка больше двух: пользователь был заинтересова в произведении, иначе - нет
            for (var i = recMethodCode; i <= 4; i++) {
                let newOutputFile = './recommendation_tests/u2.result' + '_' + distanceMethodCode + '_' + i + '_' + 10 + '_' + 10;
                let result = { tp: 0, fp: 0, fn: 0 };
                var calculateRecommendedCreationsExecutionTimeSum = 0;
                var sumOfRatingDiffs = 0;
                var sumOfSquareRatingDiffs = 0;
                var numberOfPredictions = 0;
                for (user in matrix) {
                    let beforeCalculateRecommendedCreations = performance.now();
                    let recs = calculateRecommendedCreations(distances, matrix, user, amountOfNeighbours, amountOfRecs, 2, i);
                    calculateRecommendedCreationsExecutionTimeSum += performance.now() - beforeCalculateRecommendedCreations;
                    var recsInUserInterests = 0;
                    for (rec of recs) {
                        if (matrixTest[user] !== undefined) {
                            if (matrixTest[user][rec[0]] !== undefined) {
                                numberOfPredictions++;
                                sumOfRatingDiffs += Math.abs(matrixTest[user][rec[0]] - Math.round(rec[1]));
                                sumOfSquareRatingDiffs += Math.pow(matrixTest[user][rec[0]] - Math.round(rec[1]), 2);
                                if (matrixTest[user][rec[0]] > 2) {
                                    recsInUserInterests++;
                                }
                            }
                        }
                    }
                    result.tp += recsInUserInterests;
                    result.fp += recs.length - recsInUserInterests;
                    for (creation in matrixTest[user]) {
                        if (matrixTest[user][creation] > 2) {
                            result.fn++;
                        }
                    }
                    result.fn -= recsInUserInterests;
                }
                let test = {};
                //Execution time
                test.distanceTime = calculateDistancesExecutionTime;
                test.recAverageTime = calculateRecommendedCreationsExecutionTimeSum / Object.keys(matrix).length;
                //classification accuracy
                test.precision = result.tp / (result.tp + result.fp);
                test.recall = result.tp / (result.tp + result.fn);
                test.f_measure = 2 * ((result.tp / (result.tp + result.fp)) * (result.tp / (result.tp + result.fn))) / (result.tp / (result.tp + result.fn) + result.tp / (result.tp + result.fp));
                //Predictive accuracy
                test.MAE = sumOfRatingDiffs / numberOfPredictions;
                test.RMSE = Math.sqrt(sumOfSquareRatingDiffs / numberOfPredictions);
                fs.writeFile(newOutputFile, JSON.stringify(test), function (err) {
                    if (err) return console.log(err);
                    //console.log('value written for ' + baseFile + ': ' + JSON.stringify(test));
                    console.log("finished " + distanceMethodCode + '_' + i + '_' + amountOfNeighbours + '_' + amountOfRecs);
                    /*if (recMethodCode < 4 || amountOfNeighbours < 30 || amountOfRecs < 30) {
                        var newAmountOfRecs, newAmountOfNeighbours, newRecMethodCode, newDistanceMethodCode;
                        if (amountOfRecs < 30) {
                            newAmountOfRecs = 30;
                            newAmountOfNeighbours = amountOfNeighbours;
                            newRecMethodCode = recMethodCode;
                            newDistanceMethodCode = distanceMethodCode;
                        } else {
                            newAmountOfRecs = 10;
                            if (amountOfNeighbours < 50) {
                                newAmountOfNeighbours = 30;
                                newRecMethodCode = recMethodCode;
                                newDistanceMethodCode = distanceMethodCode;
                            } else {
                                newAmountOfNeighbours = 10;
                                if (recMethodCode < 4) {
                                    newRecMethodCode = recMethodCode + 1;
                                    newDistanceMethodCode = distanceMethodCode;
                                }
                            }
                        }
                        executeSingleSample('./recommendation_tests/u1.base', './recommendation_tests/u1.test', './recommendation_tests/u1.result' + '_' + newDistanceMethodCode + '_' + newRecMethodCode + '_' + newAmountOfNeighbours + '_' + newAmountOfRecs, newDistanceMethodCode, newRecMethodCode, newAmountOfNeighbours, newAmountOfRecs);
                    }*/
                });
            }

        });
    })
}

const executeTest = async (req, res) => {
    executeSingleSample('./recommendation_tests/u2.base', './recommendation_tests/u2.test', './recommendation_tests/u2.result' + '_' + 8 + '_' + 2 + '_' + 10 + '_' + 10, 8, 2, 10, 10);
    //executeSingleSample('./recommendation_tests/u2.base', './recommendation_tests/u2.test', './recommendation_tests/u2.result' + '_' + distanceMethodeCode + '_' + recMethodCode + '_' + amountOfNeighbours + '_' + amountOfRecs, distanceMethodeCode, recMethodCode, amountOfNeighbours, amountOfRecs);
    //executeSingleSample('./recommendation_tests/u3.base', './recommendation_tests/u3.test', './recommendation_tests/u3.result' + '_' + distanceMethodeCode + '_' + recMethodCode + '_' + amountOfNeighbours + '_' + amountOfRecs, distanceMethodeCode, recMethodCode, amountOfNeighbours, amountOfRecs);
    //executeSingleSample('./recommendation_tests/u4.base', './recommendation_tests/u4.test', './recommendation_tests/u4.result' + '_' + distanceMethodeCode + '_' + recMethodCode + '_' + amountOfNeighbours + '_' + amountOfRecs, distanceMethodeCode, recMethodCode, amountOfNeighbours, amountOfRecs);
}

module.exports = {
    addCreationType,
    getCreationTypeInfo,
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
    addNameToCreation,
    getAllNamesForCreation,
    addUserRecommendation,
    getUserRecommendationsForCreation,
    addCreationRelation,
    getCreationRelationsForCreation,
    getRecommendationsForUser,
    executeTest,
    callCalculateDistances,
    changeCalculateDistanceMethod,
    getPredictedScoreForCreation,
}