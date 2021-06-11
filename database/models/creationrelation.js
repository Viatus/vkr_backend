'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CreationRelation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Creations, { foreignKey: 'firstCreationId', sourceKey: 'id' });
      this.belongsTo(models.Creations, { foreignKey: 'secondCreationId', sourceKey: 'id' });
    }
  };
  CreationRelation.init({
    firstCreationId: DataTypes.INTEGER,
    secondCreationId: DataTypes.INTEGER,
    firstCreationStanding: DataTypes.STRING,
    secondCreationStanding: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CreationRelations',
  });
  return CreationRelation;
};