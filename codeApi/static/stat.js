jQuery.ajaxSetup({async: false});
$.ajaxSetup({async: false});
var stat = document.getElementById("GraphStat");
var StatChart = new Chart(stat, {
    type: 'line',
    data: {
            labels: [0, 1, 0],
            datasets: [{
                label: 'Stat',
                data: [-1, 1, -1],
                "fill": false,
                borderWidth: 1,
                borderColor: [
                    '#ff6384'
                ]
            }]
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
function compte(){
    selectedCapteurs = 0;
    document.getElementsByName("capt").forEach(element => {
        if(element.checked){
            selectedCapteurs++;
        }
    });
}

document.getElementsByName("capt").forEach(element => {
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
        req+="from/";
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

document.getElementsByName('LoadStat')[0].addEventListener('click', function(){
    var number = selectedCapteurs;
    var option = document.querySelector('input[name="option"]:checked').value;
    var freq = document.querySelector('input[name="freq"]:checked').value;
    var time = document.querySelector('input[name="time"]:checked').value;
    var test = {};
    test.labels = [];
    test.datasets = new Array();
    for(var i = 0; i < number; i++){
        console.log(i);
        test.datasets[i] = {};
        test.datasets[i].label = document.querySelectorAll('input[name="capt"]:checked')[i].id;
        test.datasets[i].borderColor = "rgba(255, 0, 0, 1)";
        test.datasets[i].borderWidth = 2;
        test.datasets[i].fill = false;
        test.datasets[i].data = [];
        console.log(createReq(document.querySelectorAll('input[name="capt"]:checked')[i].id, option, freq, time));
        $.get(createReq(document.querySelectorAll('input[name="capt"]:checked')[i].id, option, freq, time), function( dt ){
            console.log("finis : "+i);
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
            
        }else if(document.querySelector("[name='lineColor']:checked").value == "Blue"){

        }else if(document.querySelector("[name='lineColor']:checked").value == "Yellow"){

        }
    });
});