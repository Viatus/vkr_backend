module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Creations',
      'ClientId',
      {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Clients',
          key: 'id'
        }
      }
    ).then(() => {
      queryInterface.addColumn(
        'Creations',
        'CreationTypeId',
        {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: 'Creation_types',
            key: 'id'
          }
        }
      );
    }).then(() => {
      queryInterface.addColumn(
        'Creations',
        'CreationId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Creations',
            key: 'id'
          }
        }
      );
    }).then(() => {
      queryInterface.createTable(
        'Creation_tags',
        {
          CreationId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
          TagId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
        }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Creations',
      'ClientId'
    ).then(() => {
      return queryInterface.removeColumn(
        'Creations',
        'CreationTypeId'
      );
    }).then(() => {
      return queryInterface.removeColumn(
        'Creations',
        'CreationId'
      );
    }).then(() => {
      return queryInterface.dropTable('Creation_tags');
    });
  }
};
