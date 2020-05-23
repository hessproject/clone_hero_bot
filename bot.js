const runBot = () => {

    //External Imports
    const tmi = require('tmi.js');
    const fs = require('fs');
    const request = require('request');

    //Internal Imports
    const config = require('./config');
    const songList = require('./data/songsWithId.json');

    const songListUrl = 'https://tinyurl.com/yc2zwdjw';

    //Bot Variables
    const maxSongsPerUser = 2;
    const maxSongsPerSubscriber = 10;
    const channel = config.channels[0]

    const client = new tmi.client(config);
    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);
    client.connect();

    function onMessageHandler(channel, userState, msg, self){
        if (self){
            return;
        }

        const message = msg.trim().split(' ')
        const commandName = message[0]
        const songId = message[1]

        //Abort if non command chat
        if(commandName.charAt(0) != '!'){
            return;
        }

        switch(commandName){
            case '!ping':
                client.say(channel, 'Pong!');
                break;
            case "!request":
                if(checkOverRequestMax(userState)){
                    client.say(channel, `${userState['display-name']}, you have reached the maximum number of song requests. The limit is ${maxSongsPerSubscriber} for subscribers, or ${maxSongsPerUser} for others. You can request again when one of your songs is played`)
                } else {
                    addSongToList(songId, userState['display-name']);
                }
                break;
            case "!howto":
                sendRequestInstructions();
                break;
            case '!songs':
                sendSongList();
                break;
            case '!queue':
                sendNextQueue();
                break;
            case '!clearQueue':
                if(userState['display-name'] == 'hessproject'){
                    clearSongQueue();
                }
                break;
            case '!playing':
                if(userState['display-name'] == 'hessproject'){
                    playSong(songId);
                }
                break;
            default:
                console.log(`Unrecognized command : ${commandName}`);

        }
    }

    function onConnectedHandler(addr, port){
        console.log(`* Connected to ${addr}:${port}`);
    }

    //Handlers for specific commands
    function sendRequestInstructions(){
        client.say(channel, `To request a song, get the id from the song list (use !songs to get list) and request with !request <songId>`)
    }

    function sendSongList(){
        client.say(channel, `View the song list at ${songListUrl} (Google Sheet)`)
    }

    function sendNextQueue(){
        let data = fs.readFileSync('./data/songQueue.json')
        let songList = JSON.parse(data);

        if(songList.length == 1){
            client.say(channel, `The only song in the queue is: ${songList[0].Title} by ${songList[0].Artist}`)
        } else if (songList.length == 2){
            client.say(channel, `The next two songs in the queue are ${songList[0].Title} and ${songList[1].Title}`)
        } else {
            client.say(channel, `There are ${songList.length} songs in the queue, the next 3 are ${songList[0].Title}, ${songList[1].Title}, and ${songList[2].Title}`);
        }
    }

    function addSongToList(songId, requester){
        let songToAdd = songList.find(song => song.id == songId);

        if(!songToAdd){
            client.say(channel, `Song ID ${songId} does not exist on the song list!`);
            return
        }

        let requestData = {
            'Requester': requester,
            'SongId': songToAdd.id,
            'Title': songToAdd.Name,
            'Artist': songToAdd.Artist,
            'Charter': songToAdd.Charter
        }

        fs.readFile('./data/songQueue.json', (err, data) =>{
            if (err){
                console.error('Error reading songQueue: ', err)
                return;
            }
            let songQueue = JSON.parse(data) || [];

            //Check if song is already in queue before adding
            for(let i = 0; i < songQueue.length; i++){
                if(songQueue[i].SongId == songToAdd.id){
                    client.say(channel, `${songToAdd.Name} is already in the queue!`);
                    return;
                }
            }

            songQueue.push(requestData);
            fs.writeFile('./data/songQueue.json', JSON.stringify(songQueue), (err) => {
                if(err){
                    console.error(err);
                    return;
                }
                client.say(channel, `${songToAdd.Name} added to song queue`);
                console.log(`${songToAdd.Name} added to song queue`);
            })

        })
    }

    function clearSongQueue(){
        let emptySongQueue = []
        fs.writeFile('./data/songQueue.json', JSON.stringify(emptySongQueue), (err) => {
            if(err){
                console.error(err);
                return;
            }
            client.say(channel, 'Queue cleared!');
            console.log('Queue cleared!');
        })
    }

    function playSong(songId){
        fs.readFile('./data/songQueue.json', (err, data) => {
            if(err){
                console.error('Error playing song: ', err);
                return;
            }
            songQueue = JSON.parse(data);

            let idx = songQueue.findIndex((e) => {
                return e.SongId == songId;
            })

            if(idx > -1){
                songQueue.splice(idx, 1);
                console.log(`Found ${songId} in songQueue`);
            }

            fs.writeFile('./data/songQueue.json', JSON.stringify(songQueue), (err) => {
                if(err){
                    console.error(err);
                    return;
                }
                console.log(`Removed ${songId} from songQueue`);
                client.say(channel, `Playing song ID ${songId} from the queue! Have fun!`)
            });
        })
    }

    //Helper Functions
    function checkOverRequestMax(userState){
        let isSubscriber = checkIsSubscriber(userState);

        let count = getRequestCount(userState);

        if((isSubscriber && count >= maxSongsPerSubscriber) || (!isSubscriber && count >= max)){
            return true;
        }

        return false
    }

    function getRequestCount(userState){
        let data = fs.readFileSync('./data/songQueue.json');

        let count = 0;
        songQueue = JSON.parse(data);

        songQueue.forEach(song => {
            if(song.Requester == userState['display-name']){
                count++;
            } 
        })

        return count;
    }

    function checkIsSubscriber(userState){
        if(userState['badges'].hasOwnProperty('subscriber')){
            return true;
        }

        return false;
    }
};

module.exports = runBot;