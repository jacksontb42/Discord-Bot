const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const CurrencyShop = sequelize.import('models/CurrencyShop');
sequelize.import('models/Users');
sequelize.import('models/UserItems');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const shop = [
		CurrencyShop.upsert({ name: 'percocet', cost: 1, modifier: 0.50 }),
		CurrencyShop.upsert({ name: 'gamer boy piss', cost: 1, modifier: 0.20 }),
		CurrencyShop.upsert({ name: 'gamer girl piss', cost: 1, modifier: 0.35 }),
	];
	await Promise.all(shop);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);