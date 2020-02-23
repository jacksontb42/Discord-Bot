const Discord = require('discord.js');
const bot = new Discord.Client();

const token = 'Njc5NDgzNDE5Njc1MzI4NTQ4.XlIPfQ.SA0j_42k4B4hYpOFlhKn-WK-g7s';

const prefix = '!';

bot.on('ready', () =>{
    console.log("This bot is online.")
})

bot.on('message', message=>{
    
    let args = message.content.substring(prefix.length).split(" ");

    switch(args[0]){
            case 'beginshit':
                message.channel.sendMessage('Defecation has commenced.');
            break;
            case 'endshit':
                message.channel.sendMessage('Defecation has concluded.')
            break;
    }
})

bot.login(token);