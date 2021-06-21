'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Authors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      birthday: {
        type: Sequelize.DATE
      },
      description: {
        type: Sequelize.STRING
      },
      country: {
        type: Sequelize.STRING
      },
      current: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      approvedAt: {
        type: Sequelize.DATE
      },
      image_uuid: {
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Authors');
  }
};