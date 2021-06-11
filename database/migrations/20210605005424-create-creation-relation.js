'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CreationRelations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      firstCreationStanding: {
        type: Sequelize.STRING
      },
      secondCreationStanding: {
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CreationRelations');
  }
};