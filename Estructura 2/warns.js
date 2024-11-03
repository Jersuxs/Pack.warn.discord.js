const Discord = require("discord.js");
const Warn = require("../Schemas/WarnSchema.js");
const client = require('../index.js');

module.exports = {
  data: new Discord.SlashCommandBuilder()
  .setName("warns")
  .setDescription("Mira y elimina las warns de un usuario")
  .addUserOption((option) => 
    option
      .setName('usuario')
      .setDescription('Usuario del que quieres ver las warns')
      .setRequired(true)

  ),


  execute: async (interaction) => {
    const usuario = interaction.options.getUser('usuario');

    const warns = await Warn.find({ userId: usuario.id, guildId: interaction.guild.id });

    const embed = new Discord.EmbedBuilder()
      .setAuthor({ name: `${warns.length} Warns para ${usuario.username}`, iconURL: usuario.displayAvatarURL() })
      .setColor(0x0099FF)
      .setFooter({ text: `${interaction.guild.name} - ${new Date().toLocaleString()}` });

    warns.forEach((warn, index) => {
      const moderator = interaction.guild.members.cache.get(warn.moderatorId);
      embed.addFields({ name: `Warn ${index + 1}`, value: `Moderador: ${moderator ? moderator.user.username : 'Desconocido'}\n${warn.reason} - <t:${Math.floor(warn.timestamp / 1000)}:R>` });
    });

    const row = new Discord.ActionRowBuilder()
      .addComponents(
        new Discord.ButtonBuilder()
          .setCustomId('borrar_warn')
          .setLabel('🗑Borrar un warn')
          .setStyle(Discord.ButtonStyle.Danger)
      );

    const respuesta = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = i => i.user.id === interaction.user.id;
    const collector = respuesta.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      if (i.customId === 'borrar_warn') {
        const selectMenu = new Discord.StringSelectMenuBuilder()
          .setCustomId('select_warn')
          .setPlaceholder('Selecciona un warn para borrar');

        warns.forEach((warn, index) => {
          selectMenu.addOptions({
            label: `Warn ${index + 1}`,
            description: `${warn.reason.substring(0, 50)}...`,
            value: warn._id.toString()
          });
        });

        const selectRow = new Discord.ActionRowBuilder().addComponents(selectMenu);

        await i.update({ content: `${usuario.username} tiene ${warns.length} warns. Selecciona el que quieras eliminar.`, components: [selectRow] });
      } else if (i.customId === 'select_warn') {
        const warnId = i.values[0];
        const warnToDelete = warns.find(warn => warn._id.toString() === warnId);

        await Warn.findByIdAndDelete(warnId);

        const deleteEmbed = new Discord.EmbedBuilder()
          .setDescription(`<:Hecho:1272830640240197732> Warning borrada "${warnToDelete.reason}" de ${usuario.username}`)
          .setColor(0x0FFF00);

        await i.update({ content: '', embeds: [deleteEmbed], components: [] });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({ components: [] });
      }
    });
  }
};
