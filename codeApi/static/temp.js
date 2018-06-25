var temp = document.getElementById("GraphTemp");
var don;
$.get("api/014/from/1-day", function( data ){
    don = data;

    var bool = true;

    var test = {};
    test.labels = [];
    test.datasets = [{}];
    test.datasets[0].label =  'Température';
    test.datasets[0].borderColor = "#ff6384";
    test.datasets[0].borderWidth = 2;
    test.datasets[0].fill = false;
    test.datasets[0].data = [];
    console.log(data.data[0][0])
    for(var i =0; i < data.data.length; i++){
        test.datasets[0].data[i] = data.data[i][0];
        if(bool){
            test.labels[i] = data.data[i][1];
            bool = !bool;
        }else {
            test.labels[i] = "";
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
                    tension: 0.5, // disables bezier curves
                }
            }
        }
    });
});
