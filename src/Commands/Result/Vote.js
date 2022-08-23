const { MessageEmbed } = require('discord.js');
const postResultGoogleSheet = require('../../Structures/postResultGoogleSheet');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

module.exports = {
  name: 'vote-result',
  description: `Print vote result to google sheet`,
  permissions: 'ADMINISTRATOR',
  type: 'COMMAND',
  run: async ({ interaction }) => {
    const voteStatus = db.get('voteStatus').value();
    const voteId = voteStatus.voteId;
    const resultTestChannelId = '1003470340481101906';
    const sheetId = '234088626';
    const sheetName = 'vote';
    const voteRequests = [];
    const voteData = [];
    let startRowIndex = 1;

    if (interaction.channelId !== resultTestChannelId) {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setDescription('Run this command in result-test channel'),
        ],
      });
      return;
    }

    await interaction.deferReply();

    const fetchVotingData = db
      .get('voteUser')
      .value()
      .filter((e) => e.voteId === voteId);
    const votingData = Array.isArray(fetchVotingData)
      ? fetchVotingData
      : [fetchVotingData];
    const firstCountObject = votingData.reduce((r, e) => {
      if (e.firstChoice && e.firstChoice.length > 0) {
        r[`${e.firstChoice}`] = (r[`${e.firstChoice}`] || 0) + 1;
      }
      return r;
    }, {});
    const totalFirstVoteCount = Object.entries(firstCountObject).reduce(
      (total, e) => (total += e[1]),
      0
    );
    const firstCountArray = Object.entries(firstCountObject).map((e) => {
      return [
        e[0],
        e[1],
        `${((e[1] / totalFirstVoteCount) * 100).toFixed(2)}%`,
      ];
    });
    const secondCountObject = votingData.reduce((r, e) => {
      if (e.secondChoice && e.secondChoice.length > 0) {
        r[`${e.secondChoice}`] = (r[`${e.secondChoice}`] || 0) + 1;
      }
      return r;
    }, {});
    const totalSecondVoteCount = Object.entries(secondCountObject).reduce(
      (total, e) => (total += e[1]),
      0
    );
    const secondCountArray = Object.entries(secondCountObject).map((e) => {
      return [
        e[0],
        e[1],
        `${((e[1] / totalSecondVoteCount) * 100).toFixed(2)}%`,
      ];
    });
    const totalParticipantCount = fetchVotingData.length;
    const firstCountLength = firstCountArray.length;
    const secondCountLength = secondCountArray.length;

    const maxLength = Math.max(firstCountLength, secondCountLength);

    voteData.push({
      range: `${sheetName}!A${startRowIndex + 1}:C${firstCountLength + 1}`,
      values: firstCountArray,
    });
    voteData.push({
      range: `${sheetName}!D${startRowIndex + 1}:F${secondCountLength + 1}`,
      values: secondCountArray,
    });

    voteRequests.push({
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: maxLength + 1,
          endRowIndex: maxLength + 3,
          startColumnIndex: 0,
          endColumnIndex: 6,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: {
              red: 0.8,
              green: 0.5,
              blue: 0.5,
            },
            textFormat: {
              bold: true,
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor, textFormat)',
      },
    });

    voteData.push({
      range: `${sheetName}!A${maxLength + 2}:E${maxLength + 4}`,
      values: [
        ['Total', totalFirstVoteCount, '', '', totalSecondVoteCount],
        ['Total Participant', totalParticipantCount, '', '', ''],
      ],
    });

    await postResultGoogleSheet(sheetId, sheetName, voteRequests, voteData);
    await interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor('BLURPLE')
          .setTitle(`Success Print! Check google sheet.`)
          .setDescription('Check google sheet right now!'),
      ],
    });
  },
};
