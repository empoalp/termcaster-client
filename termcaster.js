#!/usr/bin/env node

var getent = require('getent'),
    request = require('request'),
    server = process.env.TERMCASTER_SERVER || 'localhost:8080',
    pty = require('pty.js'),
    WebSocket = require('ws'),
    ws, wsControl;

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
        urlControl = 'ws://' + server + '/streamer_control/' + session_id;

    var term = pty.spawn(shell_command, [], {
        cols: process.stdout.columns,
        rows: process.stdout.rows,
        cwd: process.env.HOME,
        env: process.env
    });

    term.on('data', function(data) {
        try {
            ws.send(data);
        } catch(e) {
            connect(url, function() {
                ws.send(data);
            });
        }
    });

    process.stdout.on('resize', function() {
        term.resize(process.stdout.columns, process.stdout.rows);
        wsControl.send(JSON.stringify({
            event: 'resize',
            data: { 
                columns: process.stdout.columns,
                rows: process.stdout.rows
            }
        }));
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

    ws = connect(url);
    wsControl = connect(urlControl);
}

function connect(url, cb) {
    var ws = new WebSocket(url);

    // Reconnect on close
    ws.on('close', function() {
        connect(url);
    });

    ws.on('open', function() {
        if (cb) { cb(); }
    });

    return ws;
}

