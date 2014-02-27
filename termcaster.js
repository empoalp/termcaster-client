#!/usr/bin/env node

var request = require('request'),
    server = process.env.TERMCASTER_SERVER || 'localhost:8080',
    pty = require('pty.js'),
    WebSocket = require('ws');

process.stdin.setRawMode(true);
process.stdin.unpipe();

request('http://' + server + '/newsession', function(error, respose, body) {
    console.log('Termcasting started');
    console.log('Client url: http://' + server + '/#' + body);
    StartCasting(body);
});

function StartCasting(session_id) {
    var url = 'ws://' + server + '/streamer/' + session_id,
        ws = new WebSocket(url);

    ws.on('open', function() {
        var term = pty.spawn('zsh', [], {
            cols: process.stdout.columns,
            rows: process.stdout.rows,
            cwd: process.env.HOME,
            env: process.env
        });

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
        process.stdin.pipe(term.socket);
    });
}

