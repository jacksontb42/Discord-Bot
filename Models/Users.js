module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		
		},
		user_time: {
			type: DataTypes.INTEGER,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		user_mult: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
		}
	}, {
		timestamps: false,
	});
};