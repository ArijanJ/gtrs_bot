const config = require('./config.json')
const translation = require('./translation.json')
const Discord = require('discord.js')
const axios = require('axios').default
const xpath = require('xpath'), dom = require('xmldom').DOMParser
const client = new Discord.Client()

var ip = translation.NOIP

const main = async () => {

	client.on('ready', () => {
		console.log(`Logged in as ${client.user.tag}!`)
	})

	client.on('message', async(msg) => {

		if (msg.author.bot || msg.channel.type != 'text') return 

		if (msg.mentions.has(client.user) && msg.content != '@everyone' && msg.content != '@here')
		{
			msg.channel.send(translation.MYPREFIX + "'" + config.prefix + "'")
		}

		if (!msg.content.startsWith(config.prefix)) return

		console.log(msg.content)
		
        if(msg.content == config.prefix + 'stop'){
                if(msg.author.id == config.owner)
                {
                    await msg.channel.send(translation.STOPPING)
                    client.destroy()
                    return
                }
                else{
                    await msg.channel.send(translation.NO_PERMISSION)
                    return
                }
        }

        if (msg.content.startsWith(config.prefix + 'ip')){
            if(msg.content == `${config.prefix}ip`) {
                await msg.channel.send(ip)
                return
            }
            else{
                if(msg.member.hasPermission('MANAGE_GUILD') || msg.author.id == config.owner){
                    ip = msg.content.replace(config.prefix + 'ip ', '')
                    await msg.channel.send(translation.IPCHANGEDTO + ip)
                    return
                }
            }
        }

        if (ip == 'none')
        {
            await msg.channel.send(translation.NOIP)
            return
        }

		if (msg.content.startsWith(config.prefix + translation.CMD_TIME + ' '))
		{
			playerName = msg.content.replace(config.prefix + translation.CMD_TIME + ' ', '')

			try{
				let res = await axios.get(`https://gametracker.rs/player/${ip}/${encodeURI(playerName)}`)
				console.log(`https://gametracker.rs/player/${ip}/${encodeURI(playerName)}`)

				let doc = new dom({
				    locator: {},
				    errorHandler: { warning: function (w) { }, 
				    error: function (e) { }, 
				    fatalError: function (e) { console.error(e) } }
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
				console.error(err)

				let responseEmbed = new Discord.MessageEmbed()
				.setColor(13632027)
				.setDescription(translation.NOTFOUND)

				await msg.channel.send(responseEmbed)

				return
			}
		}

		switch(msg.content.replace(config.prefix, '').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))
		{

			case 'banner':
				bannerMsg = `https://banners.gametracker.rs/${ip}/big/red/banner.jpg?${Date.now()}`
				await msg.channel.send(bannerMsg)
				break

			case 'online':
				try{
					let res = await axios.get(`http://api.gametracker.rs/demo/json/server_info/${ip}`)
					let responseData = res.data
					console.log(responseData.players_list)
					players = responseData.players_list

					playersNum = responseData.players
					playersMax = responseData.playersmax

					let responseEmbed = new Discord.MessageEmbed()
					.setColor(8311585)

					let tempDesc = '**' + translation.PLAYERSONLINE + `: ${playersNum}/${playersMax}**`

					players.forEach(player => {
						let player_name = player.player.name.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
						tempDesc = tempDesc + '\n' + player_name
					})

					responseEmbed.description = tempDesc
						
					await msg.channel.send(responseEmbed)

				}
				catch(err){
					console.error(err)
					let response = new Discord.MessageEmbed()
					.setColor(13632027)
					.setDescription(translation.ERROR)

					await msg.channel.send(response)
				}
				finally { break }
		}

	})

	client.login(config.token)
}

main()
