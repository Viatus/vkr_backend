'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Creation_Names', {
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
      CreationId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Creations',
          key: 'id'
        }
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Creation_Names');
    //БУКВА МАЛЕНЬКАЯ АЛЕ НЕ ЗАБУДЬ СНАЧАЛА undo сделать
  }
};