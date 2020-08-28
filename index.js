const Discord = require('discord.js');
const math = require('mathjs');
const util = require('util');
const { Op } = require('sequelize');

const { Users, CurrencyShop, UserItems } = require('./dbObjects');

const token = '';
const PREFIX = '!';
const currency = new Discord.Collection();
const client = new Discord.Client();

client.on('ready', () =>{
    console.log("This bot is online.");
})

Reflect.defineProperty(currency, 'add', {
	value: async function add(id, amount) {
		const user = currency.get(id);
		if (user) {
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(currency, 'getBalance', {
	value: function getBalance(id) {
		const user = currency.get(id);
		return user ? user.balance : 0;
	},
});

Reflect.defineProperty(currency, 'use', {
	value: async function use(id, item) {
		const user = currency.get(id);
		if (user) {
			user.use(item);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);
		return newUser;
	},
});

client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
	if (message.author.bot) return;

	if (!message.content.startsWith(PREFIX)) return;

	// In case this is the first time this user has messaged in the server, we want to register them with shitbot
	const user = currency.get(message.author.id);
	if (!user){
		console.log(`New user detected! Adding new user ${message.author.id} to user database`)
		const newUserEntry = await Users.create({ user_id: message.author.id, balance: 0 });
		currency.set(message.author.id, newUserEntry);
		const newInvEntry = await UserItems.create({ user_id: message.author.id});

	};
	// End user registration

	// Process our message (remove prefix, check for length, and regEx to separate command and arguments)
	const input = message.content.slice(PREFIX.length).trim();
	if (!input.length) return;
	const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);
	// End message processing

	// begin actions based on result of command
	if (command === 'balance' || command === 'bal') {
		const target = message.mentions.users.first() || message.author;
		return message.channel.send(`${target.tag} has ${currency.getBalance(target.id)}💩`);

	} 
	else if (command === 'inventory' || command === 'inv') {
		const messageTarget = message.mentions.users.first() || message.author;
		const databaseTarget = await Users.findOne({ where: { user_id: messageTarget.id } });
		const items = await databaseTarget.getItems(databaseTarget.user_id).filter((item) => {
			return item.item_id != null || item.item_id != undefined;
		})

		if (!items || items.length <= 0) return message.channel.send(`${messageTarget.tag} has nothing!`);
		return message.channel.send(`${messageTarget.tag} currently has \n${items.map(t => `${t.amount} ${t.item.name}`).join('\n')}`);

	}
	else if (command === 'buy') {
		const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs.toLowerCase() } } });
		if (!item) return message.channel.send('That item doesn\'t exist.');
		if (item.cost > currency.getBalance(message.author.id)) {
			return message.channel.send(`You don't have enough currency, ${message.author}`);
		}
		const user = await Users.findOne({ where: { user_id: message.author.id } });
		currency.add(message.author.id, -item.cost);
		await user.addItem(item, message.author.id);

		message.channel.send(`You've bought a ${item.name}`);

	} 
	else if (command === 'shop') {
		const items = await CurrencyShop.findAll();
		return message.channel.send(items.map(i => `${i.name}: ${i.cost}💩`).join('\n'), { code: true });

	} 
	else if (command === 'leaderboard' || command === "lb") {
		return message.channel.send(
			currency.sort((a, b) => b.balance - a.balance)
				.filter(user => client.users.has(user.user_id))
				.first(10)
				.map((user, position) => `(${position + 1}) ${(client.users.get(user.user_id).tag)}: ${user.balance}💩`)
				.join('\n'),
			{ code: true }
		);

	} 
	else if (command === 'beginshit' || command === 'bs') {
		const user = await Users.findOne({ where: { user_id: message.author.id } });
		const date = new Date();
		const userTime = date.getTime();
		await user.update({
			user_time: userTime
		});
		return message.channel.send('Shitting has commenced.');

	}
	else if (command === 'endshit' || command === 'es') {
		const user = await Users.findOne({ where: { user_id: message.author.id } });
		if(user.user_time < 0){
			return message.channel.send(`You're trying to doubleshit! That's not allowed.`);
		}
		const userTime = user.user_time;
		const date = new Date();
		const shitTime = date.getTime();
		const time = shitTime - userTime;
		const shortTime = math.ceil(time/1000);
		//If you want decimals, remove math.floor
		const adjustedTime = math.floor(shortTime * user.user_mult);
		await user.update({
			user_mult: 1,
			user_time: -1
		});
		currency.add(message.author.id,adjustedTime);
		return message.channel.send(`Shitting has concluded. You spent ${shortTime} seconds shitting. You earned ${adjustedTime} 💩`);

	}
	else if (command === 'use') {
		const itemToUse = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs.toLowerCase() } } });
		const user = await Users.findOne({ where: { user_id: message.author.id } });
		if (!itemToUse) return message.channel.send('That item doesn\'t exist.');

		// for a user, go to the database, and get the items associated with jack
		const userItems = await user.getItems(user.user_id);

		// We have the items associated with jack, they're in a list called 'items'
		// Now we will find the item jack is trying to use in the list 'items'
		const correctItem = userItems.find((item) => {
			return item.item_id == itemToUse.id
		});

		if(!correctItem || correctItem.amount < 1){
			return message.channel.send(`You don't have enough of that item.`);
		}
		// If jack does have the item, the related modifier is added to the user and the item is removed from 'items'
		if (correctItem.amount >= 1){
			const newmult = user.user_mult + itemToUse.modifier;
			await user.update({
				user_mult: newmult
			});
		}
		await user.subtractItem(itemToUse, user.user_id);

		return message.channel.send(`You have used one ${itemToUse.name}! Your multiplier has increased by ${itemToUse.modifier}`)

	} else if (command === 'multiplier' || command === 'mult'){
		const user = await Users.findOne({ where: { user_id: message.author.id } });
		return message.channel.send(`Your multiplier is ${user.user_mult}`)

	}
});


client.login(token);