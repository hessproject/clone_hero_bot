const fs = require('fs');

fs.readFile('./data/songs.json', 'utf8', (err, json) => {
    
    if (err){
        console.error('Error reading file: ', err);
        return;
    }

    try {
        let songs = JSON.parse(json)
        let id = 1;

        //Add incrementing ID property to each song
        songs.forEach(song => {
           song.id = id;
           id++;
        });

        //Save as new file
        fs.writeFile('./data/songsWithId.json', JSON.stringify(songs), (err) => {
            if(err){
                console.error(err);
                return;
            }
            console.log('New Song List Created')
        });

    } catch (err) {
        console.error('Error adding IDs to song list: ', err);
    }
})