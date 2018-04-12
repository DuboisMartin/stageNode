var temp = document.getElementById("GraphTemp");
var don;
$.get("http://localhost/api/temp/0-1000", function( data ){
    don = data;

    var bool = true;

    var test = {};
    test.labels = [];
    test.datasets=[{}];
    test.datasets[0].labels =  'Température';
    test.datasets[0].borderColor = "rgba(255, 0, 0, 1)";
    test.datasets[0].borderWidth = 2;
    test.datasets[0].fill = false;
    test.datasets[0].data = [];
    for(var i =0; i < data.length; i++){
        test.datasets[0].data[i] = data[i].texte; 
        if(bool){
            test.labels[i] = data[i].id;
            bool = !bool;
        }else {
            test.labels[i] = data[i].id = "";
            bool = !bool;
        }
    }
    console.log(test);
    var tempChart = new Chart(temp, {
        type: 'line',
        data: test,
        options: {
            elements: {
                line: {
                    tension: 0, // disables bezier curves
                }
            }
        }
    });
});
