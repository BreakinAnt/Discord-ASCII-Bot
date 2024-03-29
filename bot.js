var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var mysql = require('mysql');

//-- Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//--- Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    console.log("***Bot has logged in***");
});

//connecting with our mysql server
var con = mysql.createConnection({
    host: 'host',
    user: 'user',
    password: 'password',
   });
  
  con.connect(function(err) {
    if (err) throw err;
    console.log("***Database has logged in***");  
  });  

//receiving message
bot.on('message', function (user, userID, channelID, message, evt) {
    //it will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!' && userID != bot.id) {
        var args = message.substring(1).split(' ');
        var params = args[1];
        var asciiUser = message.substring(10);
        var cmd = args[0];

        switch(cmd) {
            // adding an ascii
            case 'asciiadd':
                asciiAdd(user, channelID, charReplace(asciiUser));
            break;

            //retrieving an ascii from our database
            case 'asciiget':                                              
                asciiGet(channelID, params);                                                              
            break;

            //showing commands
            case 'asciihelp':
                asciiHelp(channelID);
            break;
        }                          
    }     
}); 
//

//--- chat commands ---
function asciiAdd(user, channelID, params){
    if (params != null) {
        bot.sendMessage({
            
            to: channelID,
            message: "Adding...\n"
            
        });
		
        sqlInsert(params, user, message => {
            bot.sendMessage({
                
                to: channelID,
                message: message
            
            });
        }); 
	
    } else {
        bot.sendMessage({
            
            to: channelID,
            message: "No ASCII found."
            
        });
    }
}

function asciiGet(channelID, params){ 
    if (params != null && params >= 0) {         
        asciiSelect(params, message => {
            bot.sendMessage({
            
                to: channelID,
                message: message
            
            });   
        });
    } else {                               
        asciiSelectRandom(message => {
			bot.sendMessage({
       
            to: channelID,
            message: message
                
            });
        });
    }
}

function asciiHelp(channelID){
    bot.sendMessage({
            
        to: channelID,
        message: "Commands:\n"+
        "!asciiadd [ASCII HERE]\n"+
        "!asciiget [ASCII'S ID HERE] (leave it empty to pick a random one)\n"
    
    });    
}

//insert ascii
function sqlInsert(art, name, callback){    
    con.query("SELECT arte_ascii, id_ascii FROM pOwQ5cpo4x.tb_ascii WHERE BINARY '"+art+"' = BINARY arte_ascii", function (err, result) {                              
  
        let comparationArt;   
          
        if (result != ""){
            comparationArt = result[0].arte_ascii;                       
		} else {
            comparationArt = null;
        }
			
        //check to see if art(ascii user has inputed) is equal to comparationArt(ascii found on our database) before adding it
        if (charReplace(art) == comparationArt) {            
                callback(`ASCII already exists by ID: ${result[0].id_ascii}`);   
        } else {
            asciiInsert(art, name); 				
            //returns the ascii's ID that we just added to our database            
            con.query("SELECT id_ascii FROM pOwQ5cpo4x.tb_ascii WHERE BINARY '"+art+"' = BINARY arte_ascii", function (err, result) {                
                if (err) throw err;
                callback(`User ${name} has added:\n${charOriginal(art)}\nID: ${result[0].id_ascii}`);            
            });              
        }                  
    });     

    function asciiInsert(art, name){ 
        let sql = "INSERT INTO pOwQ5cpo4x.tb_ascii (arte_ascii, nome_ascii, data_ascii) VALUES ( '"+art+"', '"+name+"', CURDATE())";
        con.query(sql, function (err) {
            if (err) throw err;        
        }); 
    }
}

//select specific id
function asciiSelect(id, callback){
    con.query("SELECT * FROM pOwQ5cpo4x.tb_ascii WHERE "+id+" = id_ascii", function (err, result) {
        
        //check to see if it has found an ascii     
        if (result != ""){
                callback(`ID: ${result[0].id_ascii}\n${charOriginal(result[0].arte_ascii)}`);                                                                        
        } else {
            callback("No ASCII found.");
        }        
    });
}

//select and picking a random one from the list
function asciiSelectRandom (callback){
    con.query("SELECT * FROM pOwQ5cpo4x.tb_ascii", function (err, result) {
        if (err) throw err;
        let idRandom = Math.random() * result.length;
        idRandom = parseInt(idRandom ++, 10);
        callback(`ID: ${result[idRandom].id_ascii}\n${charOriginal(result[idRandom].arte_ascii)}`);                                                                          
    });
}

//replacing certain characters
function charReplace (ascii){  
    return ascii.replace(/'/g, "¹").replace(/"/g, "²").replace(/;/g, "³");     
}

//returning to its original form
function charOriginal (ascii){
    return ascii.replace(/¹/g, "'").replace(/²/g, '"').replace(/³/g, ";"); 
}
