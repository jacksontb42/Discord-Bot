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
			type: DataTypes.DECIMAL,
			defaultValue: 1,
			allowNull: false,
		}
	}, {
		timestamps: false,
	});
};