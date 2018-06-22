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
var selectedCapteursColor = new Array();
var regex = new RegExp("^#([0-9a-f]{3}|[0-9a-f]{6})$");
function compte(){
    selectedCapteursTab = new Array();
    selectedCapteursColor = new Array();
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
    console.log(capt);
    console.log(opt);
    console.log(freq);
    console.log(time);
    var req = "api/"+capt+"/";
    
    if(freq != "all"){
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
    }

    if(freq == "all"){
        req+="from/";
    }else if(freq == "day"){
        req+="day/";
    }else if(freq == "month"){
        req+="month/";
    }else if(freq == "year"){
        req+="year/";
    }

    if(time == 'day'){
        req+="1-day";
    }else if(time == 'week'){
        req+="1-week";
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
    /*selectedCapteursTab.forEach(element => {
        if(document.querySelector('input[id="lineColor'+element.value+'"]').value.length == 7 && regex.exec(document.querySelector('input[id="lineColor'+element.value+'"]').value).length > 0){
            selectedCapteursColor.push([element, document.querySelector('input[id="lineColor'+element.value+'"]').value]);
        }
    });*/

    StatChart.data.datasets = new Array();
    StatChart.data.labels = new Array();
    StatChart.update();
    var number = selectedCapteurs;
    var time = document.querySelector('input[name^="time"]:checked').value;
    var test = {};
    test.labels = [];
    test.datasets = new Array();
    for(var i = 0; i < number; i++){
        var option = [];
        document.querySelectorAll('input[name^="option"]:checked').forEach(function(elem){
            if(!elem.disabled){
                option.push(elem.value);
            }
        });
        var freq = [];
        document.querySelectorAll('input[name^="freq"]:checked').forEach(function(elem){
            if(!elem.disabled){
                freq.push(elem.value);
            }
        });
        var labelNumber = num(freq, time);
        test.datasets[i] = {};
        test.datasets[i].label = selectedCapteursTab[i].value;
        test.datasets[i].borderColor = "rgba(255, 0, 0, 1)";
        test.datasets[i].borderWidth = 2;
        test.datasets[i].fill = false;
        test.datasets[i].data = [];
        
        $.get(createReq(selectedCapteursTab[i].value, option[i], freq[i], time), function( dt ){
            var boolBoucle = false;
            if(StatChart.data.labels.length == 0 ){
                boolBoucle = true;
            }
            console.log("DT\n\r"+dt);
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

document.querySelectorAll('[id^="defaultCheck"]').forEach(function(elem) {
    console.log(elem);
    elem.addEventListener('click', function(ele){
        console.log(ele.target);
        document.getElementsByName('option'+ele.target.value).forEach(function(el) {
            console.log(el);
            el.disabled = !el.disabled;
        });
        document.getElementsByName('freq'+ele.target.value).forEach(function(el) {
            console.log(el)
            el.disabled = !el.disabled;
        });
    });
});