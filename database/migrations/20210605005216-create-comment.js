'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Comments', {
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
      content: {
        allowNull: false,
        type: Sequelize.STRING
      },
      datePublished: {
        allowNull: false,
        type: Sequelize.DATE
      },
      parentComment: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Comments',
          key: 'id'
        }
      },
      DiscussionId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Discussions',
          key: 'id'
        }
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Comments');
  }
};