'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserRecommendations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ClientId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Clients',
          key: 'id'
        }
      },
      firstCreationId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Creations',
          key: 'id'
        }
      },
      secondCreationId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Creations',
          key: 'id'
        }
      },
      content: {
        type: Sequelize.STRING
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserRecommendations');
  }
};