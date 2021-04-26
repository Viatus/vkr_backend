'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Creation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Clients);
      this.belongsTo(models.Creations);
      this.belongsTo(models.Creation_types);
      this.belongsToMany(models.Tags, {through: 'Creation_tags'});
      this.belongsToMany(models.Authors, {through: 'Participation'});
      this.belongsToMany(models.Roles, {through: 'Participation'});
    }
  };
  Creation.init({
    name: DataTypes.STRING,
    CreationTypeId: DataTypes.INTEGER,
    date_published: DataTypes.DATE,
    description: DataTypes.STRING,
    current: DataTypes.BOOLEAN,
    country: DataTypes.STRING,
    age_rating: DataTypes.STRING,
    ClientId: DataTypes.INTEGER,
    CreationId: DataTypes.INTEGER,
    date_updated: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Creations',
  });
  return Creation;
};