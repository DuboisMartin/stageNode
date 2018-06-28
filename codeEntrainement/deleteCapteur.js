var old = require('config.json')('./config.json');

function MEH(num){
    for(var i = 0; i < old.capteurs.length; i++){
        console.log(old.capteurs[i].id)
        if(old.capteurs[i].id == num){
            console.log("Deleted at i = "+i+": "+old.capteurs[i].id)
            old.capteurs.splice(i,1);
        }
    }
    console.log(old.capteurs);
}

MEH(10);