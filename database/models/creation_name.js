'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Creation_Names extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Creations);
    }
  };
  Creation_Names.init({
    name: DataTypes.STRING,
    CreationId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Creation_Names',
  });
  return Creation_Names;
};