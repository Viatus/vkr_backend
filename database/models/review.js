'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Clients);
      this.belongsTo(models.Creations);
    }
  };
  Review.init({
    score: DataTypes.INTEGER,
    ClientId: DataTypes.INTEGER,
    CreationId: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Reviews',
  });
  return Review;
};