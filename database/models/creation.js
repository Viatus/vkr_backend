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
      this.hasMany(models.Creation_Names);
      this.belongsToMany(models.Tags, { through: 'Creation_tags' });
      this.belongsToMany(models.Authors, { through: 'Participation' });
      this.belongsToMany(models.Roles, { through: 'Participation' });
      this.hasMany(models.Reviews, { as: "creation_reviews" });
    }
  };
  Creation.init({
    CreationTypeId: DataTypes.INTEGER,
    date_published: DataTypes.DATE,
    description: DataTypes.STRING,
    current: DataTypes.BOOLEAN,
    country: DataTypes.STRING,
    age_rating: DataTypes.STRING,
    ClientId: DataTypes.INTEGER,
    CreationId: DataTypes.INTEGER,
    date_updated: DataTypes.DATE,
    image_uuid: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Creations',
  });
  return Creation;
};