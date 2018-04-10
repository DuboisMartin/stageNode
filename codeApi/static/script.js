$("#conteneur").load("c.html", function () {
    //region graph
    var temp = document.getElementById("tempChart");
    var tempChart = new Chart(temp, {
        type: 'line',
        data: {
            labels: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
            datasets: [{
                label: 'Température',
                data: [9, 3, 7, 2, 9, 1, 5],
                "fill": false,
                borderWidth: 1,
                borderColor: [
                    'rgb(183, 28, 28)'
                ]
            }]
        },
        options: {
            elements: {
                line: {
                    tension: 0, // disables bezier curves
                }
            }
        }
    });
    tempChart.chart.defaultColor = 'rgba(255, 255, 255, 0.1)';

    var vitesse = document.getElementById("vitesseChart");
    var vitesseChart = new Chart(vitesse, {
        type: 'line',
        data: {
            labels: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
            datasets: [{
                label: 'Vitesse du vent',
                data: [5, 9, 3, 6, 7, 2, 8],
                "fill": false,
                borderWidth: 1,
                borderColor: [
                    'rgb(183, 28, 28)'
                ]
            }]
        },
        options: {
            elements: {
                line: {
                    tension: 0, // disables bezier curves
                }
            }
        }
    });

    var rain = document.getElementById("rainChart");
    var rainChart = new Chart(rain, {
        type: 'line',
        data: {
            labels: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
            datasets: [{
                label: 'Précipitation',
                data: [8, 2, 7, 6, 3, 9, 5],
                "fill": false,
                borderWidth: 1,
                borderColor: [
                    'rgb(183, 28, 28)'
                ]
            }]
        },
        options: {}
    });

    var humi = document.getElementById("humiChart");
    var humiChart = new Chart(humi, {
        type: 'line',
        data: {
            labels: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
            datasets: [{
                label: 'Humidité',
                data: [80, 20, 70, 60, 30, 90, 50],
                "fill": false,
                borderWidth: 1,
                borderColor: [
                    'rgb(183, 28, 28)'
                ]
            }]
        },
        options: {}
    });

    var soleilTime = document.getElementById("soleilTimeChart");
    var soleilTimeChart = new Chart(soleilTime, {
        type: 'line',
        data: {
            labels: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
            datasets: [{
                label: 'Temp d\'ensoleillement',
                data: [8, 2, 7, 6, 3, 9, 5],
                "fill": false,
                borderWidth: 1,
                borderColor: [
                    'rgb(183, 28, 28)'
                ]
            }]
        },
        options: {}
    });

    var soleil = document.getElementById("soleilChart");
    var soleilChart = new Chart(soleil, {
        type: 'line',
        data: {
            labels: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
            datasets: [{
                label: 'Rayonnement lumineux',
                data: [8, 2, 7, 6, 3, 9, 5],
                borderWidth: 1,
                borderColor: [
                    'rgb(183, 28, 28)'
                ]
            }]
        },
        options: {}
    });
    //endregion
});

function whenHashChange(){
    if(window.location.hash == "#"){
        alert("Home");
    }else if(window.location.hash == "#Temperature"){
        alert("Température");
    }else if(window.location.hash == "#Vitesse"){
        alert("Vitesse");
    }else if(window.location.hash == "#Precipitation"){
        alert("Précipitation");
    }
}
whenHashChange();

window.addEventListener('hashchange', whenHashChange);