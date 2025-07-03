const express = require('express');
const Socket = require('socket.io');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var playerIndex = 0;
var hasGameStarted = false;
var wordToDraw = null;
var cancelChooseWordTimer;
var chooseWordTime = 20; // in s
var drawTime = 80; // in s
var wordOptions = [];
var chosenPlayer;
var guessersList = [];
var scoreBoard = [];
var cancelDrawTimer = null;
var chatAdminPWD = "admin";


app.use(express.static('public'));


function random_word_gen() {
    wordlist =[
        'apple', 'banana', 'cat', 'dog', 'tree', 'sun', 'moon', 'fish', 'bird', 'car',
        'hat', 'cake', 'phone', 'balloon', 'ice cream', 'flower', 'chair', 'ball', 'book', 'star',
        'tooth', 'eye', 'nose', 'ear', 'hand', 'foot', 'arm', 'leg', 'mouth', 'face',
        'cup', 'clock', 'bed', 'table', 'fork', 'spoon', 'knife', 'house', 'cloud', 'rain',
        'snow', 'fire', 'rainbow', 'shoe', 'guitar', 'drum', 'keyboard', 'microphone', 'bear', 'chocolate',
        'cookie', 'pancake', 'egg', 'sandwich', 'pizza', 'burger', 'donut', 'milk', 'water', 'soda',
        'rocket', 'airplane', 'boat', 'train', 'bus', 'bicycle', 'submarine', 'ship', 'truck', 'jeep',
        'candle', 'camera', 'map', 'flag', 'bell', 'ribbon', 'ladder', 'magnet', 'hammer', 'nail',
        'screw', 'wrench', 'saw', 'paint', 'brush', 'sponge', 'soap', 'comb', 'razor', 'towel',
        'castle', 'tower', 'bridge', 'mountain', 'volcano', 'island', 'cave', 'forest', 'desert', 'beach',
        'snake', 'spider', 'ant', 'bee', 'butterfly', 'caterpillar', 'dinosaur', 'monkey', 'lion', 'tiger',
        'zebra', 'elephant', 'giraffe', 'cow', 'horse', 'pig', 'sheep', 'goat', 'wolf', 'frog',
        'octopus', 'crab', 'shark', 'dolphin', 'whale', 'seal', 'penguin', 'lizard', 'turtle', 'camel',
        'cheese', 'corn', 'carrot', 'potato', 'broccoli', 'tomato', 'lettuce', 'mushroom', 'pea', 'onion',
        'glove', 'sock', 'jacket', 'pants', 'shirt', 'dress', 'skirt', 'tie', 'belt', 'shoe',
        'sunglasses', 'backpack', 'wallet', 'watch', 'ring', 'necklace', 'earring', 'crown', 'mask', 'umbrella',
        'pencil', 'pen', 'eraser', 'marker', 'ruler', 'notebook', 'paper', 'folder', 'scissors', 'tape',
        'tv', 'radio', 'lightbulb', 'fan', 'lamp', 'speaker', 'plug', 'wire', 'battery', 'remote',
        'robot', 'alien', 'ghost', 'zombie', 'skeleton', 'monster', 'dragon', 'ninja', 'pirate', 'wizard',
        'superhero', 'princess', 'king', 'queen', 'knight', 'elf', 'genie', 'angel', 'devil', 'clown',
        'circle', 'square', 'triangle', 'starfish', 'jellyfish', 'pancake', 'cloud', 'raincoat', 'magnet', 'anchor',
        'barn', 'mailbox', 'brick', 'tunnel', 'fence', 'cave', 'street', 'park', 'traffic', 'globe',
        'planet', 'comet', 'satellite', 'astronaut', 'spaceship', 'moonlight', 'sunset', 'horizon', 'eclipse', 'orbit',
        'leaf', 'branch', 'root', 'acorn', 'pinecone', 'flowerpot', 'seed', 'thorn', 'bush', 'stump',
        'chess', 'dice', 'card', 'domino', 'marble', 'swing', 'slide', 'seesaw', 'sandbox', 'trampoline',
        'shampoo', 'toothbrush', 'toothpaste', 'mirror', 'sink', 'shower', 'stamp', 'envelope', 'charger', 'tablet',
        'coin', 'bill', 'bank', 'check', 'piggybank', 'receipt', 'safe', 'helmet', 'vest', 'shield',
        'sword', 'armor', 'cape', 'boots', 'badge', 'farm', 'tractor', 'plow', 'hay', 'stable',
        'campfire', 'sunglasses', 'headphones', 'lighthouse', 'moon', 'rocket', 'fireplace', 'grape',
    'scooter', 'microphone', 'trophy', 'bottle', 'zebra', 'snowman', 'shark', 'mailbox', 'axe',
    'boomerang', 'penguin', 'swing', 'ladder', 'puzzle', 'tractor', 'tornado', 'beehive',
    'wheelchair', 'soap', 'crayon', 'backpack', 'popsicle' 
    ];

    return wordlist[Math.floor(Math.random() * wordlist.length)]
}

let players = [];
const socs = new Set();

class Player {
    constructor(playerName, socID, isRoomOwner = false) {
        this.playerName = playerName;
        this.socID = socID;
        this.isRoomOwner = isRoomOwner;
        this.score = 0;
    }

    getPlayerSocID() {
        return this.socID;
    }

    getPlayerName() {
        return this.playerName;
    }

    getIsRoomOwner() {
        return this.isRoomOwner;
    }

    setScore(val) {
        this.score = val;
    }

    getScore() {
        return this.score;
    }
}

playersList = {}
var soc;
var uniqueName = true;
// When a client connects to the server
io.on('connection', socket => {
    soc = socket;
    console.log('A user connected:', socket.id);
    socs.add(socket);

    socket.on('playerName', pName => {
        players.forEach(p => {
            if (p.getPlayerName() == pName) {
                socket.disconnect();
                uniqueName = false;
                return;
            }
        });
        if (!uniqueName) {
            uniqueName = true;
            return;
        }
        if (players.length == 0 && uniqueName) {
            let newPlayerJoined = new Player(pName, socket, true);
            socket.emit('hostPlayer', true);
            players.push(newPlayerJoined);
        } else {
            if (uniqueName) {
                let newPlayerJoined = new Player(pName, socket);
                players.push(newPlayerJoined);
            }
        }

        playersList[pName] = 0;
        socket.broadcast.emit('newPlayerJoined', pName);
        socket.emit('playersList', JSON.stringify(playersList));

        uniqueName = true;
    });

    if (hasGameStarted) {
        socket.emit('gameStarted');
    }

    socket.emit('welcom', "welcome to skribbl");

    socket.on('position', position => {
        // Broadcast the message to all clients
        socket.broadcast.emit('otherPOS', position);

    });

    socket.on('startPaint', paint => {
        socket.broadcast.emit('startPaint', paint);
    });



    socket.on('startGame', () => {
        socket.broadcast.emit('gameStarted');
        hasGameStarted = true;
        gameStart();
    });

    socket.on('penColor', hexValue => {
        io.sockets.emit('penColor', hexValue);

    });

    socket.on('clearCanvas', () => {
        io.sockets.emit('clearCanvas');
    });

    socket.on('vote', status => {
        io.sockets.emit('vote', status);
    });


    socket.on('chosenWord', cWord => {
        wordToDraw = cWord;
        io.sockets.emit('wordCount', cWord.length)
        cancelChooseWordTimer();
    });



    socket.on('updateText', receivedMsg => {
        if (wordToDraw != null) {
            var formattedWord = receivedMsg[1];
            formattedWord = formattedWord.toLowerCase();
            formattedWord = formattedWord.trim();
            var formattedGuessWord = wordToDraw.toLowerCase();
            formattedGuessWord = formattedGuessWord.trim();
        }



        if (receivedMsg[1].includes("//admin")) {
            adminControl(receivedMsg[1]);
        }


        if (formattedGuessWord == formattedWord && !guessersList.includes(receivedMsg[0]) && players.length > 1) {
            io.sockets.emit('correctGuess', [receivedMsg[0], wordToDraw]);
            guessersList.push(receivedMsg[0]);
        } else if (receivedMsg[1].includes(wordToDraw) && receivedMsg[1].length <= wordToDraw.length + 1 && !guessersList.includes(receivedMsg[0])) {
            io.sockets.emit('chatContent', receivedMsg);
            io.sockets.emit('chatContent', [receivedMsg[0], "almost"]);
        } else if (!receivedMsg[1].includes("//admin")) {
            io.sockets.emit('chatContent', receivedMsg);
        }

        if (guessersList.length == players.length - 1 && cancelDrawTimer != null) {
            io.sockets.emit('allGuessed');
            cancelDrawTimer();
        }

        

    });

    function adminControl(command) {
        var commands = command.split(" ");
        if (commands[1] == chatAdminPWD) {
            if (commands[2] == "kickall") {
                socs.forEach(s => {
                    s.disconnect(true);
                });
                console.log(">Admin kicked all players.");
            } else if (commands[2] == "kick") {
                players.forEach(p => {
                    if (p.getPlayerName() == commands[3]) {
                        socs.forEach(soc => {
                            if (p.getPlayerSocID().id == soc.id) {
                                soc.disconnect();
                                io.sockets.emit('chatContent', ["kick", commands[3]]);
                                console.log(`>Admin kicked ${commands[3]}`);
                            }
                        });
                    }
                });
            } else if (commands[2] == "givePoints") {
                players.forEach(p => {
                    if (p.getPlayerName() == commands[3]) {
                        p.setScore(parseInt(commands[4]));
                        console.log(`>Admin added ${commands[4]}Points to ${commands[3]}`);
                    }
                });
            } else if (commands[2] == "setdrawtime") {
                var oldDrawTime = drawTime;
                drawTime = parseInt(commands[3]);
                console.log(`>Admin set draw time from ${oldDrawTime} to ${commands[3]}`);
            } else if (commands[2] == "setchoosetime") {
                var oldChooseTime = chooseWordTime;
                chooseWordTime = parseInt(commands[3]);
                console.log(`>Admin set time to choose word from ${oldChooseTime} to ${commands[3]}`);
            } else if (command[2] == "restart") {
                socket.broadcast.emit('gameStarted');
                hasGameStarted = true;
                gameStart();
            }
        }
    }

    // When the client disconnects
    socket.on('disconnect', () => {
        //delete (users[socket.id])
        console.log('A user disconnected: ', socket.id);
        players.forEach(function (p, i) {
            if (p.getPlayerSocID().id == socket.id) {
                if (chosenPlayer == p.getPlayerName()) {
                    if (cancelChooseWordTimer != null && cancelDrawTimer != null) {
                        cancelChooseWordTimer();
                        cancelDrawTimer();
                        console.log("Drawing player left...");

                    }
                }

                if (p.isRoomOwner) {
                    hasGameStarted = false;
                    socs.forEach(s => {
                        s.disconnect(true);
                    });
                    if (cancelChooseWordTimer != null && cancelDrawTimer != null) {
                        cancelChooseWordTimer();
                        cancelDrawTimer();
                    }
                }
                socket.broadcast.emit('playerLeft', p.getPlayerName());
                players.splice(i, 1);
                delete playersList[p.getPlayerName()];
            }
        });
    });




    async function Fun() {
        cancelChooseWordTimer = null;
        cancelDrawTimer = null;
        guessersList = [];
        scoreBoard = [];
        io.sockets.emit('chooseStart', chooseWordTime);
        await chooseWordtimer();
        io.sockets.emit('chooseEnd');
        if (wordToDraw == null) {
            wordToDraw = wordOptions[0];
            console.log("AUTO CHOSEN WORD: ", wordToDraw);
            io.sockets.emit('wordCount', wordToDraw.length)
            io.sockets.emit('chosenWord', [wordToDraw, chosenPlayer]);
        }
        io.sockets.emit("drawStart", drawTime);
        await Drawingtimer();
        io.sockets.emit('drawEnd');
        function calculateScore(playerIndex) {
            if (playerIndex === 0) {
                return 300;
            } else {
                const baseScore = 290;
                const scoreReduction = (playerIndex - 1) * 10;
                return baseScore - scoreReduction;
            }
        }
        function reduceScoreOnTime() {

        }

        for (let i = 0; i < guessersList.length; i++) {
            const player = guessersList[i];
            const score = calculateScore(i);
            players.forEach(element => {
                if (element.getPlayerName() == guessersList[i]) {
                    var s = element.getScore() + score;
                    element.setScore(s);
                    scoreBoard.push([element.getPlayerName(), element.getScore()]);
                }
                if (element.getPlayerName() == chosenPlayer && guessersList.length != 0) {
                    scoreBoard.push([chosenPlayer, element.getScore() + 100]);
                }

            });




        }
        io.sockets.emit('scoreBoard', scoreBoard);


        function chooseWordtimer() {
            return new Promise((res) => {
                cancelChooseWordTimer = res;
                var t = setTimeout(() => {
                    res();
                    clearTimeout(t);
                }, (chooseWordTime * 1000) + 10);
            });
        }

        function Drawingtimer() {
            return new Promise((res) => {
                cancelDrawTimer = res;
                var t = drawTimerID = setTimeout(() => {
                    res();
                    clearTimeout(t);
                }, (drawTime * 1000) + 10);

            });
        }
        gameStart();
    }


    function gameStart() {
        wordToDraw = null;
        wordOptions = [];
        if (playerIndex <= players.length - 1) {
            chosenPlayer = players[playerIndex].getPlayerName();

            for (let i = 0; i < 3; i++) {
                var genWord = random_word_gen();
                if (!wordOptions.includes(genWord)) {
                    wordOptions.push(genWord);
                } else {
                    wordOptions.push(random_word_gen());
                }
            }
            io.sockets.emit('chosenPlayer', chosenPlayer);
            io.sockets.emit('wordList', wordOptions);
            playerIndex++;
            Fun();
        } else {
            playerIndex = 0;
            console.log("END OF GAME...");
            io.sockets.emit('gameOver');
        }
    }

});



const port = 3000;

app.get('/', (req, res) => {
    res.sendFile('/public/index.html')
});



server.listen(port, () => {
    console.log(`Listening on port ${port}...`);
    console.log(`Open -> http://localhost:${port} to play :)`)
});