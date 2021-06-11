const {
    StatusCodes,
} = require('http-status-codes');
const { Sequelize } = require('../database/models');
const models = require('../database/models');
const client = require('../database/models/client');
const Op = Sequelize.Op;


const addCreationType = async (req, res) => {
    //Временно закоментировано
    /*if (!req.client.is_admin) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: "Недостаточно привелегий" }); //Поменять статус
    }*/
    if (req.body.name === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    if (req.body.description === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Отсутствует имя" }); //Поменять статус
    }
    try {
        const newCreationType = await models.Creation_types.create({ name: req.body.name, description: req.body.description });
        console.log(newCreationType);
        return res.status(StatusCodes.CREATED).json({ newCreationType });
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

    //Добавить UUID картинки к базе: готово?

    models.Creation_types.findOne({ where: { name: req.body.creation_type } }).then(async (result) => {
        try {
            if (result === undefined) {
                return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такого жанра не существует" });
            }
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
        if (result !== null) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "Такое имя уже добавлено" });
        }
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
        const newTag = await models.Tags.create({ name: req.body.name, description: req.body.description });
        console.log(newTag);
        return res.status(StatusCodes.CREATED).json({ newTag });
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
    /*if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Недостаточно прав" });
    }*/

    models.Creations.findOne({ where: { id: req.params.id } }).then(async (result) => {
        result.destroy().then((result2) => {
            return res.status(StatusCodes.OK).json({ message: 'success' });
        });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    });
}


const approveCreation = async (req, res) => {
    //Временно закоментировано
    /*if (!req.client.is_admin) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Недостаточно привелегий" });
    }*/



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
    console.log(req.body.creation_id);
    models.Tags.findAll({ include: [{ model: models.Creations, through: 'Creation_Tags', where: { id: req.headers.creation_id } }] }).then((result) => {
        var ids = [];
        for (tag of result) {
            ids.push(tag.id);
        }
        //Не забыть проверить работает ли оно вообще(вроде работает?)
        models.Creations.findAll({ include: [{ model: models.Tags, through: "Creation_Tags", where: { id: ids } }, { model: models.Creation_Names, attributes: ['name'] }] }).then((result2) => {
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

const getUnapprovedCreations = async (req, res) => {
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
        req.query.string = "%" + req.query.string + "%";
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
    models.Creations.findAll({ attributes: ['id'], include: [{ model: models.Creation_Names, attributes: ['name'], where: { name: { [Op.like]: req.query.string } } }], where: { current: true }, /*order: [[req.query.sort_param, req.query.sort_order]],*/ limit: req.query.limit, offset: (req.query.page - 1) * req.query.limit }).then((result) => {
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
    if (req.body.firstCreationId === undefined || req.body.secondCreationId === undefined || req.body.firstCreationStanding === undefined || req.body.secondCreationStanding) {
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
    if (req.query.critic_lower_limit === undefined) {
        req.query.critic_lower_limit = 0;
    }
    if (req.query.rating_treshold === undefined) {
        req.query.rating_treshold = 0;
    }
    if (req.query.similar_critics_max_number === undefined) {
        req.query.similar_critics_max_number = 5;
    }
    if (req.query.recommeded_creations_max_number === undefined) {
        req.query.recommeded_creations_max_number = 10;
    }
    models.Creations.findAll({ where: { current: true }, attributes: ['id'] }).then((creations) => {
        models.Clients.findAll({ include: [{ model: models.Reviews, attributes: ['CreationId', 'score'] }], attributes: ['id'] }).then((clients) => {
            var matrix = {};
            for (cl of clients) {
                var clientReviews = {};
                var reviewedCreations = [];
                for (rev of cl.Reviews) {
                    let crId = rev.dataValues.CreationId;
                    let score = rev.dataValues.score;
                    clientReviews[crId] = score;
                    reviewedCreations.push(crId);
                }
                for (creation of creations) {
                    let crId = creation.dataValues.id;
                    if (!reviewedCreations.includes(crId)) {
                        clientReviews[crId] = 0;
                    }
                }
                matrix[cl.dataValues.id] = clientReviews;
            }
            let distances = calculateDistances(matrix);
            var critics = [];
            for (var user in distances[req.client.id]) {
                if (user != req.client.id) {
                    if (distances[req.client.id][user] >= req.query.critic_lower_limit) {
                        critics.push([user, distances[req.client.id][user]]);
                    }
                }
            }
            critics.sort(function (a, b) {
                return b[1] - a[1];
            });
            critics = critics.slice(0, req.query.similar_critics_max_number);

            var ratings = [];
            //Basic reccomendations
            for (creation of creations) {
                if (matrix[req.client.id][creation.dataValues.id] == 0) {
                    var simSum = 0;
                    var totalRating = 0;
                    for (critic of critics) {
                        simSum += critic[1];
                        totalRating += critic[1] * matrix[critic[0]][creation.dataValues.id];
                    }
                    //Чтобы не рекомендовать то, на что шансов нет. Можно выставить как порог
                    if (totalRating > req.query.rating_treshold) {
                        ratings.push([creation.dataValues.id, totalRating / simSum]);
                    }
                }
            }
            ratings.sort(function (a, b) {
                return b[1] - a[1];
            });
            ratings = ratings.slice(0, req.query.recommeded_creations_max_number);
            /*var result = {};
            for (rating of ratings) {
                result[rating[0]] = rating[1];
            }
            return res.status(StatusCodes.OK).json({ result });*/
            var ids = [];
            for (rating of ratings) {
                ids.push(rating[0]);
            }
            //В этом случае теряется порядок и нет ожидаемой оценки(она вроде особо и не нужна, а вот порядок было бы неплохо сохранять)
            models.Creations.findAll({ where: { id: ids }, include: [{ model: models.Creation_Names, attributes: ['name'] }] }).then((result) => {
                return res.status(StatusCodes.OK).json({ result });
            }).catch((err) => {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            });
        }).catch((err) => {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        });
    }).catch((err) => {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    });
}

//calculate the euclidean distance btw two item
var calculateDistances = function (dataset) {

    console.log(dataset);
    var distances = {};
    for (firstUser in dataset) {
        var userDistances = {};
        userDistances[firstUser] = -1;
        for (secondUser in dataset) {
            if (firstUser == secondUser) {
                continue;
            }
            //Euclidean distance
            /*var distanceToSecondUser = 0;
            for (creation in dataset[firstUser]) {
                distanceToSecondUser += Math.pow(dataset[firstUser][creation] - dataset[secondUser][creation], 2);
            }
            distanceToSecondUser = Math.sqrt(distanceToSecondUser);*/
            //Constrained Pearson Correlation
            var upperSum = 0;
            var firstLowerSum = 0;
            var secondLowerSum = 0;
            for (creation in dataset[firstUser]) {
                upperSum += (dataset[firstUser][creation] - 5) * (dataset[secondUser][creation] - 5);
                firstLowerSum += Math.pow(dataset[firstUser][creation] - 5, 2);
                secondLowerSum += Math.pow(dataset[secondUser][creation] - 5, 2);
            }
            let distanceToSecondUser = upperSum / (Math.sqrt(firstLowerSum) * Math.sqrt(secondLowerSum));
            userDistances[secondUser] = distanceToSecondUser;
        }
        distances[firstUser] = userDistances;
    }
    console.log(distances);
    return distances;
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
}