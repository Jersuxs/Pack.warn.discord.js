const Discord = require("discord.js");
const Warn = require("../../Schemas/WarnSchema.js");
const client = require('../../index.js')

module.exports = {
  name: 'warn',
  description: 'Advierte a un usuario',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'usuario',
      description: 'El usuario que quieres advertir',
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'razón',
      description: 'La razón de la advertencia',
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    const usuario = interaction.options.getUser('usuario');
    const razón = interaction.options.getString('razón');

    const embed = new Discord.EmbedBuilder()
      .setTitle("¿Estás seguro de warnear a este usuario?")
      .setDescription(`Usted quiere warnear a ${usuario.username}, esta acción es reversible mediante el comando \`\`/warns\`\``)
      .setColor(16711680);

    const row = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
          .setCustomId('confirmar_warn')
          .setLabel('✔️Confirmar')
          .setStyle(Discord.ButtonStyle.Success),
        new Discord.ButtonBuilder()
          .setCustomId('retroceder_warn')
          .setLabel('❌Retroceder')
          .setStyle(Discord.ButtonStyle.Danger)
      );

    const respuesta = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = i => i.user.id === interaction.user.id;
    const collector = respuesta.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirmar_warn') {
        const newWarn = new Warn({
          userId: usuario.id,
          guildId: interaction.guild.id,
          reason: razón,
          moderatorId: interaction.user.id
        });

        await newWarn.save();

        const warnEmbed = new Discord.EmbedBuilder()
          .setTitle("Warneo a un usuario")
          .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
          .setDescription(`El usuario ${usuario} fue warneado, esto solo es un aviso nada más.\n**Razón**:\n${razón}`)
          .setFooter({ text: new Date().toLocaleString() });

        await i.update({ content: `${usuario}`, embeds: [warnEmbed], components: [] });
      } else if (i.customId === 'retroceder_warn') {
        await i.update({ content: 'La advertencia ha sido cancelada.', embeds: [], components: [] });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({ content: 'El tiempo para responder ha expirado.', embeds: [], components: [] });
      }
    });
  }
};
