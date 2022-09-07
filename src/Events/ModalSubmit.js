const { MessageEmbed } = require('discord.js');
const Profile = require('../Models/Profile');
const Goods = require('../Models/Goods');
const structureConfig = require('../Structures/Config');
const { createOrder, getCurrentKoreanDate } = require('../Structures/Utils');
const guildId = structureConfig.guildOnly.guildID;
const postOrderGoogleSheet = require('../Structures/postOrderGoogleSheet');

module.exports = {
  event: 'interactionCreate',
  type: 'MODAL_SUBMIT',
  async run(bot, interaction) {
    if (!interaction.customId) return;

    await interaction.reply('order loading...');

    if (interaction.customId.includes('orderInformation')) {
      const guild = await bot.guilds.cache.get(guildId);
      const userId = interaction.user.id;
      const today = new Date();
      const inputValue = [];
      const [goodsNumber, goodsPrice] = interaction.customId.match(/\d+/g);
      const sheetName = 'order';
      const profile = await Profile.find({ UserID: userId, GuildID: guild.id });
      const userInformation = await guild.members.cache.find(
        (member) => member.id === userId
      );
      const goods = await Goods.find({ GoodsID: goodsNumber });
      interaction.components.map((component) => {
        const componentProperty = component.components[0];
        inputValue.push(componentProperty.value);
      });
      const cellRange = inputValue.length === 3 ? 'A:G' : 'A:H';

      inputValue.unshift(userInformation.user.username);
      inputValue.splice(2, 0, userId, today, goodsNumber);

      if (profile.length === 0) {
        await interaction.editReply({
          content: 'order failed',
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setDescription(`You don't have profile. Make a profile first.`),
          ],
        });
        return;
      }

      if (goods[0].Count === 0) {
        await interaction.editReply({
          content: 'order failed',
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setDescription(
                'This goods is soldout. Please buy another goods'
              ),
          ],
        });
        return;
      }

      await Goods.updateOne({ GoodsID: goodsNumber }, { $inc: { Count: -1 } });
      await createOrder(guild.id, inputValue);
      inputValue.splice(3, 1, today.toISOString().slice(0, 10));
      await postOrderGoogleSheet(`${sheetName}!${cellRange}`, inputValue);
      await Profile.updateOne(
        { UserID: userId, GuildID: guild.id },
        { $inc: { Wallet: -goodsPrice } }
      );
      await interaction.editReply({
        content: 'order success',
        embeds: [
          new MessageEmbed()
            .setColor('BLURPLE')
            .setDescription(`Your order was completed successfully!`),
        ],
      });
    }
  },
};
