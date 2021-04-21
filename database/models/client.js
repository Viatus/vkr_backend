module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Clients', {
    nickname: DataTypes.STRING,
    email: DataTypes.STRING,
    hash: DataTypes.STRING,
    is_admin: DataTypes.BOOLEAN
  }, {});
  Client.associate = function(models) {
    // associations can be defined here
  };
  return Client;
};