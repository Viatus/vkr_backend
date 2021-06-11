'use strict';
const {
  Model, Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Clients);
      this.belongsTo(models.Comments, {foreignKey: 'parentComment', sourceKey:'id'});
      this.belongsTo(models.Discussions, {foreignKey: 'DiscussionId', sourceKey:'id'});
    }
  };
  Comment.init({
    ClientId: DataTypes.INTEGER,
    content: DataTypes.STRING,
    datePublished: DataTypes.DATE,
    parentComment: DataTypes.INTEGER,
    DiscussionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Comments',
  });
  return Comment;
};