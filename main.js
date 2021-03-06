const config = require('./config.json')
const translation = require('./translation.json')
const fs = require('fs')
const cachedIPs = require('./cachedIPs.json')
const axios = require('axios').default
const xpath = require('xpath'), dom = require('xmldom').DOMParser
const Discord = require('discord.js')

const client = new Discord.Client()

var ipMap = {} 

const colors = {
    GREEN: 8311585,
    RED: 13632027
}

const bannerColors = ["red", "blue", "brown", "darkgray", "gray", "green", "purple"]

async function writeCache(){
	fs.writeFileSync('cachedIPs.json', JSON.stringify(ipMap, null, 4))
}

function replaceCharacters(str){
    return str.replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#96;/g, "\\`")
    .replace(/&#39;/g, "'")
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
}

async function sendEmbed(channel, color, message){
    let responseEmbed = new Discord.MessageEmbed()
        .setColor(color)
        .setDescription(message)
    await channel.send(responseEmbed)
}

const main = async () => {

	client.on('ready', () => {

		console.log(`Logged in as ${client.user.tag}!`)

		client.guilds.cache.map(guild => guild.id).forEach(element => {
			if (cachedIPs[element]){
				console.log(`Setting IP of ${client.guilds.cache.get(element)} to ${cachedIPs[element]}`)
				ipMap[element] = cachedIPs[element]
			}
			else{
				console.log(`Setting IP of ${client.guilds.cache.get(element)} to ${translation.NOIP}`)
				ipMap[element] = translation.NOIP
			}
			try{
				console.log('Writing to cachedIPs.json')
				fs.writeFileSync('cachedIPs.json', JSON.stringify(ipMap, null, 4))
			}
			catch(err){
				console.error(err)
				return
			}
		})

	})

	client.on('message', async(msg) => {

		if (msg.author.bot || msg.channel.type != 'text') return
		if (msg.mentions.has(client.user) && !msg.content.includes('@everyone') && !msg.content.includes('@here'))
		{
            sendEmbed(msg.channel, colors.GREEN, translation.MYPREFIX + "'" + config.prefix + "'")
		}
		
		if (!msg.content.startsWith(config.prefix)) return
		
		const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();

		console.log(`[${msg.guild.name}] ${msg.content}`)

        if(command == 'stop'){
                if(msg.author.id == config.owner)
                {
                    await sendEmbed(msg.channel, colors.RED, translation.STOPPING)
                    client.destroy()
                    return
                }
                else{
                    await sendEmbed(msg.channel, colors.RED, translation.NOPERMISSION)
                    return
                }
        }
		
        if (command == 'ip'){
			if(args.length == 0) {
                await sendEmbed(msg.channel, colors.GREEN, `IP: ${ipMap[msg.guild.id]}`)
                return
            }
            else{
				if(msg.member.hasPermission('MANAGE_GUILD') || msg.author.id == config.owner){
					ipMap[msg.guild.id] = args[0]
                    await sendEmbed(msg.channel, colors.GREEN, translation.IPCHANGEDTO + ipMap[msg.guild.id])
					writeCache()
                    return
                }
            }
        }
		
		if (ipMap[msg.guild.id] == translation.NOIP)
		{
			await sendEmbed(msg.channel, colors.RED, translation.NOIP)
			return
		}

		switch(command)
		{

			case 'banner':
                let color = args[0] || 'red'
                if(!bannerColors.includes(color) && args.length > 0){
                    let responseEmbed = new Discord.MessageEmbed()
                    .setColor(colors.RED)
                    let description = translation.COLORSAVAILABLE
                    bannerColors.forEach(color => {
                        description+= `\n${color}`
                    })
                    responseEmbed.setDescription(description)
                    await msg.channel.send(responseEmbed)
                    break
                }
				bannerMsg = `https://banners.gametracker.rs/${ipMap[msg.guild.id]}/big/${color}/banner.jpg?${Date.now()}`
				await msg.channel.send(bannerMsg)
				break

			case 'online':
				try{
					let res = await axios.get(`http://api.gametracker.rs/demo/json/server_info/${ipMap[msg.guild.id]}`)
					let responseData = res.data
					players = responseData.players_list

					playersNum = responseData.players
					playersMax = responseData.playersmax

					let responseEmbed = new Discord.MessageEmbed()
					.setColor(8311585)

					let tempDesc = '**' + translation.PLAYERSONLINE + `: ${playersNum}/${playersMax}**`

					players.forEach(player => {
						let player_name = replaceCharacters(player.player.name)
						tempDesc = tempDesc + '\n' + player_name
					})

					responseEmbed.description = tempDesc
						
					await msg.channel.send(responseEmbed)

				}
				catch(err){
					console.error("Error occured")
                    await sendEmbed(msg.channel, colors.RED, translation.ERROR)
				}
				finally { break }

			case translation.CMD_TIME:
				playerName = args.splice(0, args.length).join(" ");

				try{

					let res = await axios.get(`https://gametracker.rs/player/${ipMap[msg.guild.id]}/${encodeURI(playerName)}`)
					console.log(`https://gametracker.rs/player/${ipMap[msg.guild.id]}/${encodeURI(playerName)}`)

					let doc = new dom({
						locator: {},
						errorHandler: { warning: function (w) { }, 
						error: function (e) { }, 
						fatalError: function (e) { console.log("Error on handling DOM") } }
					}).parseFromString(res.data)
					
					let timeNodes = xpath.select('//*[@id="main"]/div[1]/ul[2]/li[2]/dl/dd[2]/span', doc)
					let lastSeenNodes = xpath.select('//*[@id="main"]/div[1]/ul[2]/li[1]/dl/dd[3]/span', doc)
					let killsNodes = xpath.select('//*[@id="main"]/div[1]/ul[2]/li[2]/dl/dd[1]/span', doc)

					let time = timeNodes[0].firstChild.data
					let lastSeen = lastSeenNodes[0].firstChild.data
					let kills = killsNodes[0].firstChild.data

					let responseEmbed = new Discord.MessageEmbed()
						.setColor(8311585)
						.addFields(
							{name: translation.PLAYER, value: playerName},
							{name: translation.TIME, value: time}, 
							{name: translation.KILLS, value: kills},
							{name: translation.LASTSEEN, value: lastSeen},
						)

					msg.channel.send(responseEmbed)
				}

				catch(err){
					console.error("Error occured")
                    await sendEmbed(msg.channel, colors.RED, translation.NOTFOUND)
					return
				}

				break

			case 'top15':
				try{
					let res = await axios.get(`https://gametracker.rs/server_players/${ipMap[msg.guild.id]}/`)

					let doc = new dom({
						locator: {},
						errorHandler: { warning: function (w) { }, 
						error: function (e) { }, 
						fatalError: function (e) { console.error(e) } }
					}).parseFromString(res.data)

					let nameNodes = xpath.select('//table[@class="player-list"]//td[2]//a', doc)
					let timeNodes = xpath.select('//table[@class="player-list"]//td[5]', doc)

					let embedNames = '';
					let embedTimes = '';

					let responseEmbed = new Discord.MessageEmbed()

						.setColor(8311585)

						let index = 0

						nameNodes.forEach(node => {
							let name = replaceCharacters(node.firstChild.data)
							let time = timeNodes[index].firstChild.data

							if(name == 'profile' || index - 1 == 14) {return}
							console.log(name)
							embedTimes += `${time}\n`
							embedNames += `${index + 1}. ${name}  \n`
							index++
						})

						responseEmbed.addField(translation.PLAYER, embedNames, true)
						responseEmbed.addField(translation.TIME, embedTimes, true)

						await msg.channel.send(responseEmbed)

				}
				catch(err){
					console.error(err)
                    await sendEmbed(msg.channel, colors.RED, translation.ERROR)
					return
				}

		}

	})

	client.login(config.token)
}

main()
