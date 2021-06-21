'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Creations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date_published: {
        type: Sequelize.DATE
      },
      description: {
        type: Sequelize.STRING
      },
      current: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      country: {
        type: Sequelize.STRING
      },
      age_rating: {
        type: Sequelize.STRING
      },
      date_updated: {
        allowNull: false,
        type: Sequelize.DATE
      },
      image_uuid: {
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Creations');
  }
};