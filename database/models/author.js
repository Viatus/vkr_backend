'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Author extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Creations, {through: 'Participation'});
      this.belongsToMany(models.Roles, {through: 'Participation'});
    }
  };
  Author.init({
    name: DataTypes.STRING,
    birthday: DataTypes.DATE,
    description: DataTypes.STRING,
    current: DataTypes.BOOLEAN,
    approvedAt: DataTypes.DATE,
    image_uuid: DataTypes.STRING,
    country: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Authors',
  });
  return Author;
};