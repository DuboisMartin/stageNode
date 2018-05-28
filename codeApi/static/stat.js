jQuery.ajaxSetup({async: false});
$.ajaxSetup({async: false});
var stat = document.getElementById("GraphStat");
var StatChart = new Chart(stat, {
    type: 'line',
    data: {
            labels: [],
            datasets: []
        },
    options: {
        elements: {
            line: {
                tension: 0.1, // disables bezier curves
            }
        }
    }
});

var selectedCapteurs = 0;
var selectedCapteursTab = new Array();
function compte(){
    selectedCapteursTab = new Array();
    selectedCapteurs = 0;
    document.querySelectorAll('input[id^="defaultCheck"]').forEach(element => {
        if(element.checked){
            selectedCapteursTab.push(element);
            selectedCapteurs++;
        }
    });
}

document.querySelectorAll('input[id^="defaultCheck"]').forEach(element => {
    element.addEventListener('click', compte);
});

function createReq(capt, opt, freq, time){
    var req = "https://localhost/api/"+capt+"/";
    
    if(opt == 'Moyenne'){
        req+="average/";
    }else if(opt == "Max"){
        req+="max/";
    }else if(opt == "Min"){
        req+="min/";
    }else if(opt == "Ecart_type"){
        req+="ecart/";
    }else if(opt == "Variance"){
        req+="variance/";
    }else if(opt == "Skewness"){
        req+="skewness/";
    }

    if(freq == "all"){
        req+="";
    }else if(freq == "day"){
        req+="day/";
    }else if(freq == "month"){
        req+="month/";
    }else if(freq == "year"){
        req+="year/";
    }

    if(time == 'day'){
        req+="1-day";
    }else if(time == 'month'){
        req+="1-month";
    }else if(time == 'year'){
        req+="1-year";
    }

    return req;

}

function num(freq, duree){
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

document.getElementsByName('LoadStat')[0].addEventListener('click', function(){
    StatChart.data.datasets = new Array();
    StatChart.data.labels = new Array();
    StatChart.update();
    var number = selectedCapteurs;
    var time = document.querySelector('input[name^="time"]:checked').value;
    var test = {};
    test.labels = [];
    test.datasets = new Array();
    for(var i = 0; i < number; i++){
        var option = document.querySelectorAll('input[name^="option"]:checked')[i].value;
        var freq = document.querySelectorAll('input[name^="freq"]:checked')[i].value;
        var labelNumber = num(freq, time);
        test.datasets[i] = {};
        test.datasets[i].label = selectedCapteursTab[i].value;
        test.datasets[i].borderColor = "rgba(255, 0, 0, 1)";
        test.datasets[i].borderWidth = 2;
        test.datasets[i].fill = false;
        test.datasets[i].data = [];
        
        $.get(createReq(selectedCapteursTab[i].value, option, freq, time), function( dt ){
            var boolBoucle = false;
            if(StatChart.data.labels.length == 0 ){
                boolBoucle = true;
            }
            
            for(var j = 0; j < dt.data.length; j++){
                if(boolBoucle == true){
                    StatChart.data.labels.push(dt.data[j][2])
                }
                test.datasets[i].data.push(dt.data[j][0]);
            }
            StatChart.data.datasets.push(test.datasets[i]);
            StatChart.update();
        });
    }
    
});

function addData(chart, label, data){
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

document.getElementsByName('backColor').forEach((element) => {
    element.addEventListener('click', function(){
        if(document.querySelector("[name='backColor']:checked").value == "Gray"){
            document.querySelectorAll(".content .card")[0].style.backgroundColor = "#f7f7f7";
        }else if(document.querySelector("[name='backColor']:checked").value == "Dark"){
            document.querySelectorAll(".content .card")[0].style.backgroundColor = "#1a1a1a";
        }else if(document.querySelector("[name='backColor']:checked").value == "White"){
            document.querySelectorAll(".content .card")[0].style.backgroundColor = "#ffffff";
        }
    });
});

document.getElementsByName('lineColor').forEach((element) => {
    element.addEventListener('click', function(){
        if(document.querySelector("[name='lineColor']:checked").value == "Red"){
            console.log(StatChart.config.data.datasets[0].borderColor[0]);
        }else if(document.querySelector("[name='lineColor']:checked").value == "Blue"){

        }else if(document.querySelector("[name='lineColor']:checked").value == "Yellow"){

        }
    });
});