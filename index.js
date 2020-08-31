const Discord = require('discord.js');
const math = require('mathjs');
const util = require('util');
const { Op } = require('sequelize');

const {discordToken} = require('./token');
const { Users, CurrencyShop, UserItems } = require('./dbObjects');

const token = discordToken;
const PREFIX = '!';
const currency = new Discord.Collection();
const client = new Discord.Client();

// Turn the client on
client.on('ready', () =>{
    console.log("This bot is online.");
})

// Define modify currency function
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

// Define get balance function
Reflect.defineProperty(currency, 'getBalance', {
	value: function getBalance(id) {
		const user = currency.get(id);
		return user ? user.balance : 0;
	},
});

// Define use item function
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

// Check database for current entries and log the end of startup process
client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
	console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', async message => {
	// Filter out messages that the bot can ignore
	if (message.author.bot) return;
	if (!message.content.startsWith(PREFIX)) return;

	// In case this is the first time this user has messaged in the server, we want to register them with the bot
	const userChecker = currency.get(message.author.id);
	if (!userChecker){
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
	
	const user = await Users.findOne({ where: { user_id: message.author.id } });
	let userTime = undefined;
	let date = undefined;
	let items = undefined;

	// begin actions based on result of command
	switch (command) {
		

		case "bal":
		case "balance":
			const target = message.mentions.users.first() || message.author;
			return message.channel.send(`${target.tag} has ${currency.getBalance(target.id)}💩`);	

		case "inv":
		case "inventory":
			const messageTarget = message.mentions.users.first() || message.author;
			const databaseTarget = await Users.findOne({ where: { user_id: messageTarget.id } });
			items = await databaseTarget.getItems(databaseTarget.user_id).filter((item) => {
				return item.item_id != null || item.item_id != undefined;
			})

			if (!items || items.length <= 0) return message.channel.send(`${messageTarget.tag} has nothing!`);
			return message.channel.send(`${messageTarget.tag} currently has \n${items.map(t => `${t.amount} ${t.item.name}`).join('\n')}`);

		case "buy":
			items = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs.toLowerCase() } } });
			if (!items) return message.channel.send('That item doesn\'t exist.');
			if (items.cost > currency.getBalance(message.author.id)) {
				return message.channel.send(`You don't have enough currency, ${message.author}`);
			}
			currency.add(message.author.id, -items.cost);
			await user.addItem(items, message.author.id);

			message.channel.send(`You've bought a ${item.name}`);
			break;

		
		case "shop":
			items = await CurrencyShop.findAll();
			return message.channel.send(items.map(i => `${i.name}: ${i.cost}💩`).join('\n'), { code: true });
		
		case "lb":
		case "leaderboard":
			return message.channel.send(
				currency.sort((a, b) => b.balance - a.balance)
					.filter(user => client.users.has(user.user_id))
					.first(10)
					.map((user, position) => `(${position + 1}) ${(client.users.get(user.user_id).tag)}: ${user.balance}💩`)
					.join('\n'),
				{ code: true }
			);

		
		case "bs":
		case "beginshit":
			date = new Date();
			userTime = date.getTime();
			await user.update({
				user_time: userTime
			});
			return message.channel.send('Shitting has commenced.');

		
		case "es":
		case "endshit":
			if(user.user_time < 0){
				return message.channel.send(`You're trying to doubleshit! That's not allowed.`);
			}
			userTime = user.user_time;
			date = new Date();
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

		case "use":
			const itemToUse = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs.toLowerCase() } } });
			if (!itemToUse) return message.channel.send('That item doesn\'t exist.');

			// for a user, go to the database, and get the items associated with jack
			items = await user.getItems(user.user_id);

			// We have the items associated with jack, they're in a list called 'items'
			// Now we will find the item jack is trying to use in the list 'items'
			const correctItem = items.find((item) => {
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

		case "mult":
		case "multiplier":
			return message.channel.send(`Your multiplier is ${user.user_mult}`)

}});


client.login(token);