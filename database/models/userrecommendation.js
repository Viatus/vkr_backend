'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserRecommendation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Clients, {foreignKey: 'ClientId', sourceKey: 'id'});
      this.belongsTo(models.Creations, {foreignKey: 'firstCreationId', sourceKey: 'id'});
      this.belongsTo(models.Creations, {foreignKey: 'secondCreationId', sourceKey: 'id'});
    }
  };
  UserRecommendation.init({
    firstCreationId: DataTypes.INTEGER,
    ClientId: DataTypes.INTEGER,
    secondCreationId: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserRecommendations',
  });
  return UserRecommendation;
};