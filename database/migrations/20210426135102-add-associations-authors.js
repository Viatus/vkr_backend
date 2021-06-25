module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Participation',
      {
        CreationId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        AuthorId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        RoleId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
      }
    )
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Participation').then(() => {
      return queryInterface.removeColumn('Authors', 'AuthorId');
    });
  }
};
