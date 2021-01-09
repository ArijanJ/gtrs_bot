const config = require('./config.json')
const translation = require('./translation.json')
const Discord = require('discord.js')
const axios = require('axios').default
const xpath = require('xpath'), dom = require('xmldom').DOMParser
const client = new Discord.Client()

const main = async () => {

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async(msg) => {

    console.log(msg.content)

    if (msg.author.bot || msg.channel.type != 'text') return 

    if (msg.mentions.has(client.user))
    {
        msg.channel.send(translation.MYPREFIX + config.prefix + '!')
    }

    if (!msg.content.startsWith(config.prefix)) return

    if (msg.content.startsWith(config.prefix + translation.CMD_TIME + ' '))
    {
        playerName = msg.content.replace(config.prefix + translation.CMD_TIME + ' ', '')

        try{
            let res = await axios.get(`https://gametracker.rs/player/${config.ip}/${encodeURI(playerName)}`)
            console.log(`https://gametracker.rs/player/${config.ip}/${encodeURI(playerName)}`)
            let doc = new dom().parseFromString(res.data)
            let nodes = xpath.select('//*[@id="main"]/div[1]/ul[2]/li[2]/dl/dd[2]/span', doc)

           // let time = nodes.data.replace('<span>', '').replace('</span>', '')
            let time = nodes[0].firstChild.data
            console.log(time)

            let responseEmbed = new Discord.MessageEmbed()
            .setColor(8311585)
            .addFields(
                {name: translation.PLAYER, value: playerName},
                {name: translation.TIME, value: time}, 
            )

            msg.channel.send(responseEmbed)
        }
        catch(err){
            console.error(err)

            let responseEmbed = new Discord.MessageEmbed()
            .setColor(13632027)
            .setDescription(translation.NOTFOUND)
            
            msg.channel.send(responseEmbed)

            return
        }
    }

    switch(msg.content.replace(config.prefix, ''))
    {

        case 'banner':
            bannerMsg = `https://banners.gametracker.rs/${config.ip}/big/red/banner.jpg?${Date.now()}`
            await msg.channel.send(bannerMsg)
            break

        case 'stop':
            if(msg.member.roles.cache.some(role => role.name === "gt.rs bot control"))
            {
                await msg.channel.send(translation.STOPPING)
                client.destroy()
                break
            }
            else{
                await msg.channel.send(translation.NO_PERMISSION)
                break
            }
    }

    })
    
    client.login(config.token)
}

main()