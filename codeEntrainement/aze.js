var moment = require('moment');

var duree = "year";
var frequence = "month";

if(duree == "month"){
    var intervalHigh = moment().startOf("month");
    var intervalLow = moment().endOf("month");
}else if(duree == "day"){
    var intervalHigh = moment().startOf("day");
    var intervalLow = moment().endOf("day");
}else if(duree == "year"){
    var intervalHigh = moment().startOf("year");
    var intervalLow = moment().endOf("year");
}

function howMany(freq, duree){
    //How many 'freq' in 'how' Ex: How many month in year
    if(duree == "year" && freq == "month"){
        return 12;
    }else if(duree == "year" && freq == "week"){
        return 52;
    }else if(duree == "year" && freq == "day"){
        return 365;
    }else if(duree == "month" && freq == "week"){
        return 4;
    }else if(duree == "month" && freq == "day"){
        return 30;
    }else if(duree == "week" && freq == "day"){
        return 7;
    }
}
var tab = [{data: '50', timestamp: '2018-06-24 13:59:25'}, {data: '100', timestamp: '2018-06-24 13:59:25'}, {data: '150', timestamp: '2018-06-24 13:59:25'}]