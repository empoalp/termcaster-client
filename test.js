var inquirer = require('inquirer');
/*
process.stdin.setRawMode(true);
process.stdin.on('data', function(data) {
    if (data[0] === 4) {
        console.log('ending', data);
    }
});
process.stdin.on('end', function() {
    console.log('asdasdsad');
});

setTimeout(function() {
    process.exit();    
}, 5000);
*/

inquirer.prompt({
    name: 'opt',
    message: 'Select option',
    type: 'list',
    choices: ['ASDASD', 'BBBB', 'BBBBCCC']
}, function(data) {
    console.log(data);
});
