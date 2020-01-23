const dateformat = require('dateformat');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function getDays(dateA, dateB) {
    return Math.round(Math.abs(
        (new Date(dateA).getTime()-new Date(dateB).getTime()) / (1000*3600*24)
    ));
}
assign(module.exports,{getDays});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function convertToDates({ days, lastDate }) {
    const dates = [];

    for (let index=0; index<days; index++) {
        dates.push(
            dateformat(
                new Date(lastDate.getTime() - 1000*60*60*24*index), 
                "yyyy-mm-dd"
            )
        );
    }
    return dates;
}
assign(module.exports,{convertToDates});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function translateNumber(number) {
    const digits = String(Math.round(number)).split('');
    const characters = [];
    for (let index=0; index<digits.length; index++) {
        if (index===4) {
            characters.push('万 ');
        }
        if (index===8) {
            characters.push('億 ');
        }
        characters.push(digits[digits.length-1-index]);
    }
    return characters.reverse().join('');
}
assign(module.exports,{translateNumber});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function translateToNumber(text="0") {
    let number = Number(text.match(/[0-9.]+/)[0]);
    if (text.match(/[Kk]/)) {
        number *= 1000;
    }
    if (text.match(/[M]/)) {
        number *= 1000000;
    }
    return number;
}
assign(module.exports,{translateToNumber});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function translateTime(time) {
    const totalSec = time/1000;
    const hours    = Math.floor(totalSec/3600);
    const minutes  = Math.floor((totalSec-hours*3600)/60);
    const seconds  = Math.floor(totalSec-hours*3600-minutes*60);

    const results = [];
    if (hours) {
        return [`${hours}時間`,`${minutes<10?'0':''}${minutes}分`,`${seconds<10?'0':''}${seconds}秒`].join(' ');
    }
    if (minutes) {
        return [`${minutes}分`,`${seconds<10?'0':''}${seconds}秒`].join(' ');
    }
    return [`${seconds}秒`].join(' ');
}
assign(module.exports,{translateTime});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

const RGBs = [
    [0,0,0],
    [100,100,100],
    [200,0,0],
    [200,100,0],
    [200,200,0],
    [0,200,0],
    [0,200,200],
    [0,100,200],
    [100,0,200],
    [200,0,200],
];
assign(module.exports,{RGBs});
