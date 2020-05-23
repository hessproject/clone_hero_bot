//External dependencies
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const runBot = require('./bot')

//App config
const app = express();
const port = 8081;
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended: false}));

//Routes
app.get('/', (req, res) => {
    let data = fs.readFileSync('./data/songQueue.json')
    let songList = JSON.parse(data);
    res.render('index', {
        songList: songList
    })
})

//Listener
app.listen(port, () => console.log(`Listening on port: ${port}`))
runBot()