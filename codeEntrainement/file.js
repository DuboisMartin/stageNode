const fs = require('fs');
fs.readdir('../codeApi/static/', (err, files) => {
    files.forEach(file => {
        if(file == "index.html"){
            myRouter.route('/').get(function(req, res){ res.sendFile(__dirname+'/static/'+file);});
        }else{
            myRouter.route('/'+file).get(function(req, res){ res.sendFile(__dirname+'/static/'+file);});
        }
    });
})