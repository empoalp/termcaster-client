#!/usr/bin/env node

var inquirer = require('inquirer'),
    getent = require('getent'),
    request = require('request'),
    server = process.env.TERMCASTER_SERVER || 'localhost:8080',
    pty = require('pty.js'),
    paused = true,
    WebSocket = require('ws');

process.stdin.setRawMode(true);
process.stdin.unpipe();

getent.passwd(process.env.LOGNAME, function(user) { 
    request('http://' + server + '/newsession', function(error, respose, body) {
        console.log('Termcasting started');
        console.log('Client url: http://' + server + '/#' + body);
        StartCasting(body, user.shell);
    });
})

function StartCasting(session_id, shell_command) {
    var url = 'ws://' + server + '/streamer/' + session_id,
        ws = new WebSocket(url);

    ws.on('open', function() {
        var term = pty.spawn(shell_command, [], {
            cols: process.stdout.columns,
            rows: process.stdout.rows,
            cwd: process.env.HOME,
            env: process.env
        });

        paused = false;

        process.stdout.on('resize', function() {
            term.resize(process.stdout.columns, process.stdout.rows);
        });

        term.on('data', function(data) {
            ws.send(data);
        });

        term.on('close', function() {
            term.socket.removeAllListeners();
            process.stdin.unpipe();
            process.stdin.pipe(process.stdout);
            console.log('Termcasting finished');
            process.exit();
        })

        term.socket.setEncoding = 'utf-8';
        term.socket.pipe(process.stdout);
        //process.stdin.pipe(term.socket);
        process.stdin.on('data', function(data) {
            if (data[0] === 4) {
                if (paused) {
                    process.exit();
                } else {
                    //term.pause();
                    paused = true;
                    console.log('');
                    inquirer.prompt({
                        name: 'opt',
                        message: 'Termcaster Menu',
                        type: 'list',
                        choices: ['Continue', 'Viewers', 'Exit']
                    }, function(data) {
                        if (data.opt === 'Continue') {
                            //term.resume(); 
                            paused = false;
                            process.stdin.unpipe();
                        } else if (data.opt === 'Exit') {
                            process.exit();
                        }
                    });
                }
            } else {
                if (!paused) {
                    term.write(data);
                } else {
                    /*if (data[0] === 'c'.charCodeAt(0)) {
                        paused = false;
                    } else if (data[0] === 'q'.charCodeAt(0)) {
                        process.exit();                        
                    }*/
                }
            }
        });
    });
}

