const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, EndBehaviorType } = require('@discordjs/voice');
const fs = require('fs');
const prism = require('prism-media');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('ready', () => {
  console.log(`Bot encendido como: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Comando para que el bot se una y empiece a grabar
  if (message.content === '!unir') {
    const channel = message.member?.voice.channel;
    if (!channel) return message.reply('¡Debes estar dentro de un canal de voz!');

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    message.reply('¡Me he unido al canal de voz! Usaré este canal para grabar.');

    const receiver = connection.receiver;
    receiver.speaking.on('start', (userId) => {
      const audioStream = receiver.subscribe(userId, {
        end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 },
      });

      const pcmStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
      const writeStream = fs.createWriteStream(`/tmp/grabacion_${userId}_${Date.now()}.pcm`);

      audioStream.pipe(pcmStream).pipe(writeStream);
    });
  }

  // Comando para desconectar al bot
  if (message.content === '!salir') {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      message.reply('Me he desconectado del canal de voz. Archivo guardado en servidor.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
