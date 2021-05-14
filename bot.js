const Discord = require("discord.js");
const client = new Discord.Client();
const configfile = require("./data/config.json");
const prefix = configfile.prefix;
const token = configfile.token;
const commands = require("./commands.json");
const falls_of_users = {};
const help_messages = require("./helps.json");
//const db_work = require("./db_work");
var is_allowed_to_fall = true;
const conflicts = {};
var is_allowed_to_census = true;
var mongoose = require("mongoose");
var user_model = require("./user_model");
const mongo_uri =
  "mongodb+srv://admin:kira2007@bot.ljnsg.mongodb.net/judgment-bot-discord";
var conflict_model = require('./conflict_model');
const moment = require("moment");
const channel_model = require("./channel_model")

function fallsPermission() {
  is_allowed_to_fall = true;

}

function censusPermission() {
  is_allowed_to_census = true;
}

function createUser(
  name,
  id,
  falls,
  conflicts,
  servers_member,
  profile_pic_link
) {
  mongoose.set('useFindAndModify', true)
    mongoose.set('useNewUrlParser', true)
    mongoose.set('useUnifiedTopology', true)
  mongoose.connect(mongo_uri, function (err, client) {
    if (err) throw err;
    console.log("Successfully connected");
    mongoose.connection.db.collection("users", function (err, collection) {
      if (err) throw err;
      console.log("Successfully connected to collection");
      var newUser = new user_model({
        _id: new mongoose.Types.ObjectId(),
        nickname: name,
        ds_id: id,
        falls: falls,
        conficts_member: conflicts,
        connected_servers: servers_member,
        profile_picture: profile_pic_link,
      });

      newUser.save(function (err) {
        if (err) throw err;

        console.log("User successfully saved.");
        mongoose.connection.close();
      });
    });
  });
}

function createChannel(title, id, channel_pic){
  mongoose.set('useFindAndModify', true)
  mongoose.set('useNewUrlParser', true)
  mongoose.set('useUnifiedTopology', true)
  mongoose.connect(mongo_uri, function (err, client) {
    if (err) throw err;
    console.log("Successfully connected");
    mongoose.connection.db.collection("channels", function (err, collection) {
      if (err) throw err;
      console.log("Successfully connected to collection");
      var newChannel = new channel_model({
        _id: new mongoose.Types.ObjectId(),
        name: title,
        ds_id: id,
        falls: {},
        scores: {},
        channel_picture: channel_pic,
      });

      newChannel.save(function (err) {
        if (err) throw err;

        console.log("Channel successfully saved.");
        mongoose.connection.close();
      });
    });
  });
}

client.on("ready", () => {
  console.log("I am ready!");
  console.log(Discord.version);
});

// Create an event listener for messages
client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.repeat) {
    //let user = message.mentions.members.first();
    //console.log(user.kick())
    let textCommand = message.content.split(" ");
    let deletedElement = textCommand.splice(0, 1);
    message.reply(message.author.username + " said: " + textCommand.join(" "));
    console.log(message.author.username + " said: " + textCommand.join(" "))
  }
});

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.help) {
    message.reply(help_messages["eng-help-msg"]);
  }
});

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.ru_help) {
    //message.reply(help_messages["ru-help-msg"]);
    const helpEmbed = new Discord.MessageEmbed()
	.setColor('#a6550c')
	.setTitle('***Help page***')
  .setThumbnail(message.author.avatarURL())
	.setDescription('Последнее сообщение (07.05.2021)')
	.addFields(
		{ name: '`b!help`', value: 'тоже самое что и `b!ruhelp`, но на английском языке!' },
    { name: '`b!repeat <message>`', value: 'Повторение `message`.' },
		{ name: '`b!conflict <linked-users-name> <punishment {fall, kick, ban}> <case>`', value: 'Краеугольная функция нашего бота. Она позволяет сделать конфликт (пожаловаться) на преступника. Решение выносится через 2 часа. Опробуйте её!', inline: true },
		{ name: '`b!fall <linked-users-name> <case>`', value: '***ДАННАЯ ФУНКЦИЯ НЕ РАБОТАЕТ НА ДАННЫЙ МОМЕНТ!*** Выдает предупреждение преступнику. За 3 фолла - кик!', inline: true },
	)
	.setTimestamp()
	.setFooter('Judgment-bot by TchTech', 'https://cdn.discordapp.com/app-icons/799723410572836874/683e0c1d8a42a80bc4fd727cccafec85.png');

message.channel.send(helpEmbed);
  }
});

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.gfall) {
    // CHECK IS THERE ARE ANY FALL COMMAND
    //if (message.member.roles.find(role => role.name === 'The Boyare')){} CHECKING OF THE ROLE

    let roles_array = [];
    message.member.roles.cache.forEach((a) => {
      roles_array.push(a.name);
    });

    if (roles_array.includes("Lawbreaker")) {
      message.reply(
        message.author.username +
          " is the Lawbreaker, that's why i will not listen to him!"
      );
    } else {
      if (typeof message.content.split(" ")[2] !== "string") {
        //WRONG MESSAGE OF SYNTAX
        message.reply(
          "clarify the user's misconduct with a comment {`b!fall <username> <comment>`}"
        );
      } else {
        //DO THE MASSIVE AS A KEY WITH CASES AND FALLS

        let user = message.mentions.members.first(); //GETTING THE NAME OF THE LAWBREAKER
        if (user == undefined) {
          message.reply(
            "You've written something wrong. Maybe linked name isn't user's (maybe linked name of role). If you didn't use linked name of the role, try again."
          );
        } else {
          if (is_allowed_to_fall === false) {
            message.reply(
              "Sorry, I have not got that permission now. Try to wait for a while..."
            );
          } else {
            falls_of_users[user] = (falls_of_users[user] || 0) + 1; //ADD FALL TO COLLECTED FALLS
            if (falls_of_users[user] >= 3) {
              //FINAL KICK IF COLLECTED SETTED NUMBERS OF FALLS (THREE)
              let bool_err = false;
              user.kick().catch((err) => {
                message.reply("ERROR APPEARED: " + err.message);
                bool_err = true;
              });
              // KICK
              if (bool_err != true) {
                message.reply(
                  user.user.username +
                    " has been kicked, because user has collected " +
                    falls_of_users[user] +
                    " fall(s)!"
                );
              }
            } else {
              //THE MESSAGE OF NEW FALL (HASN'T COLLECTED SETTED NUMBER OF FALLS)
              message.reply(
                user.user.username +
                  " has already collected " +
                  falls_of_users[user] +
                  " fall(s) in case of " +
                  message.content.split(" ").slice(2).join(" ") +
                  "!"
              );
              //is_allowed_to_fall = false;
              //setTimeout(fallsPermission, 1800000, 'funky')
            }
          }
        }
      }
    }
  }
});

client.on("message", (message)=>{
  /*mongoose.set('useFindAndModify', true)
  mongoose.set('useNewUrlParser', true)
  mongoose.set('useUnifiedTopology', true)
  mongoose.connect(mongo_uri, (err)=>{
     if(err) throw err
     mongoose.connection.db.collection('channels', (err)=>{
        if(err) throw err

     })})*/
})

function conflictConfirmation(msg, conflict_id_str, punishment){
  mongoose.set('useFindAndModify', true)
    mongoose.set('useNewUrlParser', true)
    mongoose.set('useUnifiedTopology', true)
  mongoose.connect(mongo_uri, (err)=>{
     if(err) throw err
     mongoose.connection.db.collection('conflicts', (err)=>{
      if(err) throw err
      
  try{
      const reactions = msg.reactions.cache;
      let positive_votes = reactions.get('👍');
      let negative_votes = reactions.get('👎'); 

    if(positive_votes.count > negative_votes.count){
      switch(punishment){
        case "fall":
          fallProcess(positive_votes, negative_votes);
        break;
        case "kick":
          kickProcess(positive_votes, negative_votes);
          break;
        case "ban":
          banProcess(positive_votes, negative_votes);
          break;
      }
    }else if(positive_votes.count < negative_votes.count){
      stopProcessLess(positive_votes, negative_votes);
    }else if(positive_votes.count === negative_votes.count){
      stopProcessEqual(positive_votes, negative_votes);
    }
  }catch(err){
    console.log(err)
  }
})})

  function stopProcessEqual(positive_votes, negative_votes) {
    conflict_model.findByIdAndUpdate(conflict_id_str, {
      support_votes: positive_votes.count,
      decline_votes: negative_votes.count,
      is_confirmed: "NO"
    }, (err, conflict) => {
      if (err)
        throw err;
      msg.channel.send("@everyone Внимание! По конфликту №`" + conflict_id_str + "` НЕ было вынесено решения, так как оказалось положительных и отрицательных голосов оказалось по-ровну!");
    });
  }

  function stopProcessLess(positive_votes, negative_votes) {
    conflict_model.findByIdAndUpdate(conflict_id_str, {
      support_votes: positive_votes.count,
      decline_votes: negative_votes.count,
      is_confirmed: "NO"
    }, (err, conflict) => {
      if (err)
        throw err;
      msg.channel.send("@everyone Внимание! По конфликту №`" + conflict_id_str + "` НЕ было вынесено решения, так как оказалось больше отрицательных, чем положительных голосов!");
    });
  }

  function fallProcess(positive_votes, negative_votes) {
    conflict_model.findByIdAndUpdate(conflict_id_str, {
      support_votes: positive_votes.count,
      decline_votes: negative_votes.count,
      is_confirmed: "YES"
    }, (err, conflict) => {
      if (err)
        throw err;
      mongoose.connection.db.collection('users', (err) => {
        console.log(conflict.lawbreaker.toString());
        user_model.findOneAndUpdate({ ds_id: conflict.lawbreaker.toString() }, { $inc: { 'falls': 1 } }, (err, user) => {
          if (err)
            throw err;
          console.log(user);
          let user_lawbreaker = msg.guild.members.cache.get(conflict.lawbreaker.toString());
          msg.channel.send("@everyone Внимание! По конфликту №`" + conflict_id_str + "` было вынесено решение в пользу пожаловавшегося!\nРешение: `fall` для `" + user_lawbreaker.user.username + "`;\n На данный момент у `" + user_lawbreaker.user.username + "` `" + (user.falls + 1) + "` фолл(а);");
          if ((user.falls + 1) >= 3) {
            if (user_lawbreaker.kickable === false) { msg.channel.send("ERROR: USER ISN'T KICKABLE. HIS FALLS: `" + user.falls + "`\nномер конфликта: `" + conflict_id_str + "`"); }
            else {
              user_model.findOneAndUpdate({ ds_id: conflict.lawbreaker.toString() }, { falls: 0 }, (err) => {
                if (err)
                  throw err;
              });
              msg.channel.send("Пользователь `" + user_lawbreaker.user.username + "` Набрал МАКСИМУМ фоллов(в связи с последним конфликтом номер `" + conflict_id_str + "`), а значит суд изгоняет его из сервера! GOODBYE!");
              user_lawbreaker.kick();
            }
          }
        });
      });
    });
  }

  function kickProcess(positive_votes, negative_votes) {
    conflict_model.findByIdAndUpdate(conflict_id_str, {
      support_votes: positive_votes.count,
      decline_votes: negative_votes.count,
      is_confirmed: "YES"
    }, (err, conflict) => {
      if (err)
        throw err;
      let user_lawbreaker = msg.guild.members.cache.get(conflict.lawbreaker.toString());
      if (user_lawbreaker.kickable === false) {
        msg.channel.send("ERROR: USER ISN'T KICKABLE\nномер конфликта: `" + conflict_id_str + "`");
      } else {
        msg.channel.send("@everyone Внимание! По конфликту №`" + conflict_id_str + "` было вынесено решение в пользу пожаловавшегося!\nРешение: `kick` для `" + user_lawbreaker.user.username + "`");
        user_lawbreaker.kick();
      }
    });
  }

  function banProcess(positive_votes, negative_votes) {
    conflict_model.findByIdAndUpdate(conflict_id_str, {
      support_votes: positive_votes.count,
      decline_votes: negative_votes.count,
      is_confirmed: "YES"
    }, (err, conflict) => {
      if (err)
        throw err;
      let user_lawbreaker = msg.guild.members.cache.get(conflict.lawbreaker.toString());
      msg.channel.send("@everyone Внимание! По конфликту №`" + conflict_id_str + "` было вынесено решение в пользу пожаловавшегося!\nРешение: `ban` для `" + user_lawbreaker.user.username + "`\n*(start process...)*");
      try {
        user_lawbreaker.ban();
        msg.channel.send("Процесс бана по конфликту номер `" + conflict_id_str + "` прошел успешно.");
      } catch {
        msg.channel.send("ERROR: USER COULD NOT BE BANNED.\nномер конфликта: `" + conflict_id_str + "`");
      }
    });
  }
}

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.uregistration){
    
    mongoose.connect(mongo_uri, (err)=>{
      if(err) throw err
      mongoose.connection.db.collection('users', (err)=>{
        if(err) throw err
        user_model.findOne({ds_id: message.author.id}, (err, user)=>{
          if(err) throw err
          if(user == undefined){
            createUser(message.author.username, message.author.id, 0, [0], [message.guild.id], message.author.avatarURL())
            message.reply("You was included to database successfully! Now you have ability for conflicts! Hooray!🎆\n*Вы были успешно добавлены в базу данных! Отныне у вас есть возможность конфликтовать! Урра!🎆*")
          }else{
            message.reply("Oops... You was already included to database. You've already got conflict ability.\n*Упс... Вы уже были добавлены в базу данных. Вы уже получили возможность конфликтовать.*")
          }
        })
      }) 
    })
  }
})

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.cregistration){
    
    mongoose.connect(mongo_uri, (err)=>{
      if(err) throw err
      mongoose.connection.db.collection('channels', (err)=>{
        if(err) throw err
        channel_model.findOne({ds_id: message.guild.id}, (err, channel)=>{
          if(err) throw err
          if(channel == undefined){
            createChannel(message.guild.name, message.guild.id, message.guild.iconURL())
            message.reply("Channel was included to database successfully! Now you have many abilities like score-getting! Hooray!🎆\n*Канал был успешно добавлен в базу данных! Отныне у вас есть возможности вроде получения баллов! Урра!🎆*")
          }else{
            message.reply("Oops... You was already included to database.\n*Упс... Вы уже были добавлены в базу данных.*")
          }
        })
      }) 
    })
  }
})

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.introducing){
    message.reply("Настоящее сообщение с 09.04.21 (0.5):\n@everyone Мы всё еще предлагаем вам внести свои данные в базу данных для получения возможности конфликтов при помощи `b!reg`.\n И да... насчет конфликтов... на даный момент команда `b!conflict <нарушитель> <наказание (fall-kick-ban)> <причина>` ЗАРАБОТАЛА!!! Тестируйте её по поооооолной! Конец сообщения.")
}})

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.conflict) {
    if(message.mentions.members.first() === undefined){
      message.reply("Error: вы не указали пользователя, которого хотите осудить.\nНапоминаем синтаксис написания команды: `b!conflict <преступник> <наказание (fall, kick, ban)> <причина>`")
    } else if(message.content.split(" ")[3] === undefined){
      message.reply("Error: вы не указали причину вашего обращения.\nНапоминаем синтаксис написания команды: `b!conflict <преступник> <наказание (fall, kick, ban)> <причина>`")
    } else if(message.content.split(" ")[2] !== "fall" && message.content.split(" ")[2] !== "ban" && message.content.split(" ")[2] !== "kick"){
      message.reply("Error: вы указали неверное значение наказания (или не указали его вовсе). Корректные значения: `fall`, `kick`, `ban`.\nНапоминаем синтаксис написания команды: `b!conflict <преступник> <наказание (fall, kick, ban)> <причина>`")
    } else if(message.mentions.members.first().user.id === "799723410572836874"){
      message.reply("Error: Ты серьёзно? Ты пошел жаловаться на суд в суд..? Не-а, так не получится.\nНапоминаем синтаксис написания команды: `b!conflict <преступник> <наказание (fall, kick, ban)> <причина>`")
    } else if(message.author.id === message.mentions.members.first().id){
      message.reply("Error: извините, но вы не можете жаловаться на самого себя.\nНапоминаем синтаксис написания команды: `b!conflict <преступник> <наказание (fall, kick, ban)> <причина>`")
    }
    else{ //CHECK IN DB
    let conflict_id = new mongoose.Types.ObjectId();
    let lawbreaker = message.mentions.members.first();
    let authors_id = message.author.id;
    console.log(authors_id);
    //createUser(message.author.username, message.author.id, 0, [0], [message.guild.id], message.author.avatarURL())
    mongoose.set('useFindAndModify', true)
    mongoose.set('useNewUrlParser', true)
    mongoose.set('useUnifiedTopology', true)
    mongoose.connect(mongo_uri, (err, client) => {
      if (err) throw err;
      mongoose.connection.db.collection("users", (err) => {
        if (err) throw err;
        user_model.findOne({ ds_id: authors_id }, (err, user) => {
          if (err) throw err;
          if(user === null){
            createUser(message.author.username, message.author.id, 0, [0], [message.guild.id], message.author.avatarURL())
            message.reply("Уупс... Вы не были занесены в базу даных... Но мы сами (автоматически) добавили вас в базу!\n(*Продолжаем оформление конфликта...*)")
          }
        });
        user_model.findOne({ ds_id: lawbreaker.user.id }, (err, user) => {
          if (err) throw err;
          if(user === null){
            createUser(lawbreaker.user.username, lawbreaker.user.id, 0, [0], [message.guild.id], lawbreaker.user.avatarURL())
            message.reply("Уупс... Преступник не был занесён в базу даных... Но мы сами (автоматически) добавили его(её) в базу!\n(*Продолжаем оформление конфликта...*)")
          }
        });
        conflicts[message.mentions.members.first()] = {
          reporter: message.author.username,
          reason: message.content.split(" ").slice(3).join(" "),
          punishment: message.content.split(" ").slice(2, 3).join(" "),
        };
        message.channel
          .send(
            "Предстать @everyone перед судом! На данный момент " +
              conflicts[message.mentions.members.first()].reporter +
              " устроил конфликт с " +
              lawbreaker.user.username +
              " из-за того, что " +
              conflicts[message.mentions.members.first()].reason +
              ".\nПредложенное решение: " +
              conflicts[message.mentions.members.first()].punishment +
              ".\n`ID конфликта: " + conflict_id.toHexString() + "`"
          )
          .then((m) => {
            m.react("👍");
            m.react("👎");
            try{
              setTimeout(/*43200000*/conflictConfirmation, 7200000, m, conflict_id._id.toHexString(), conflicts[message.mentions.members.first()].punishment)
              } catch(e){
                console.log(e)
              }
          });
      });
      createConflict(conflict_id, message);
    });
  }
}});

client.on("message", (message) => {
  if (message.content.split(" ")[0] === commands.census) {
    if (is_allowed_to_census === false) {
      message.reply(
        "Sorry, please, you should wait for a while, because censuses are created too often."
      );
    } else {
      //message.reply('Предстать @everyone перед судом! На данный момент ' + conflicts[message.mentions.members.first()].reporter + ' устроил конфликт с ' + lawbreaker.user.username + ' из-за того, что ' + conflicts[message.mentions.members.first()].reason + '.\nПредложенное решение: ' + conflicts[message.mentions.members.first()].punishment + '.')
      let comment = message.content.split(" ").slice(1).join(" ");
      let is_empty = false;
      if (comment === "") is_empty = true;
      is_empty
        ? message.channel
            .send(
              "Внимание, @everyone , была предложена перепись мнения (ну или сенсус). Настоятельно предлагаем поучавствовать в голосовании-опросе:\n *Довольны ли вы устройством сервера?*"
            )
            .then((m) => {
              m.react("👍");
              m.react("👎");
            })
        : message.channel
            .send(
              'Внимание, @everyone , была предложена перепись мнения (ну или сенсус). Настоятельно предлагаем поучавствовать в голосовании-опросе:\n *"' +
                comment +
                '"*'
            )
            .then((m) => {
              m.react("👍");
              m.react("👎");
            });
      is_allowed_to_census = false;
      setTimeout(censusPermission, 360000);
    }
  }
});

client.login(token);
function createConflict(conflict_id, message) {
  mongoose.connection.db.collection('conflicts', (err) => {
    if (err)
      throw err;
    let newConflict = new conflict_model({
      _id: conflict_id,
      case: conflicts[message.mentions.members.first()].reason,
      reporter: message.author.id,
      lawbreaker: message.mentions.members.first(),
      punishment: conflicts[message.mentions.members.first()].punishment,
      support_votes: 1,
      decline_votes: 1,
      judgment_date: moment().add(12, 'hours').toDate(),
      is_confirmed: 'IN_WORK'
    });
    newConflict.save((err) => {
      if (err)
        throw err;
    });

  });
}

