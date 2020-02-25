const Discord = require('discord.js');
const client = new Discord.Client();
const math = require('mathjs');

const token = 'Njc5NDgzNDE5Njc1MzI4NTQ4.XlR7eg.jP2xHNqqF-BFvV9qPFC3kc01Gc4';

const { Users, CurrencyShop } = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();
const PREFIX = '!';

client.on('ready', () =>{
    console.log("This bot is online.")
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
	const input = message.content.slice(PREFIX.length).trim();
	if (!input.length) return;
	const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);

	if (command === 'balance' || command === 'bal') {
		const target = message.mentions.users.first() || message.author;
		return message.channel.send(`${target.tag} has ${currency.getBalance(target.id)}💩`);
	} 
		else if (command === 'inventory') {
			const target = message.mentions.users.first() || message.author;
			const user = await Users.findOne({ where: { user_id: target.id } });
			const items = await user.getItems();

			if (!items.length) return message.channel.send(`${target.tag} has nothing!`);
			return message.channel.send(`${target.tag} currently has ${items.map(t => `${t.amount} ${t.item.name}`).join(', ')}`);
		}  /* else if (command === 'transfer') {
			const currentAmount = currency.getBalance(message.author.id);
			const transferAmount = commandArgs.split(/ +/).find(arg => !/<@!?\d+>/.test(arg));
			const transferTarget = message.mentions.users.first();

			if (!transferAmount || isNaN(transferAmount)) return message.channel.send(`Sorry ${message.author}, that's an invalid amount`);
			if (transferAmount > currentAmount) return message.channel.send(`Sorry ${message.author} you don't have that much.`);
			if (transferAmount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author}`);

			currency.add(message.author.id, -transferAmount);
			currency.add(transferTarget.id, transferAmount);

			return message.channel.send(`Successfully transferred ${transferAmount}💩 to ${transferTarget.tag}. Your current balance is ${currency.getBalance(message.author.id)}💩`); 
		}  */
		else if (command === 'buy') {
			const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs } } });
			if (!item) return message.channel.send('That item doesn\'t exist.');
			if (item.cost > currency.getBalance(message.author.id)) {
				return message.channel.send(`You don't have enough currency, ${message.author}`);
			}

			const user = await Users.findOne({ where: { user_id: message.author.id } });
			currency.add(message.author.id, -item.cost);
			await user.addItem(item);

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
			var date = new Date();
			user_time = date.getTime();
			return message.channel.send('Shitting has commenced.');
		}
		else if (command === 'endshit' || command === 'es') {
			var date = new Date();
			var shittime = date.getTime();
			var time = shittime - user_time;
			const user = message.author.id;
			var shortTime = math.ceil(time/1000);
			currency.add(message.author.id,shortTime);
			return message.channel.send('Shitting has concluded.' + ' You spent ' + shortTime + ' seconds shitting.');
		}
		else if (command === 'use') {
			const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs } } });
			const target = message.mentions.users.first() || message.author;
			const user = await Users.findOne({ where: { user_id: target.id } });
			if (!item) return message.channel.send('That item doesn\'t exist.');
			const items = await user.getItems();
			const correctitem = items.find((items) => {
				return items.item.name == item.name
			});
			if(correctitem.amount < 1){
				return message.channel.send(`You don't have enough of that item.`);
			}
			if (!user.hasitems.contains(item.name)){
				multiplier = multiplier + 1;
				user.hasitems.push(item.name);
				console.log(user.hasitems);
			}
			await user.subtractItem(item);
}});


client.login(token);