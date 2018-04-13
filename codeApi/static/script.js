

function whenHashChange(){
    if(window.location.hash == "#Home"){
        $("#conteneur").empty();
        $("#conteneur").load("home.html");
    }else if(window.location.hash == "#Temperature"){
        $("#conteneur").empty();
        $("#conteneur").load("temp.html");
    }else if(window.location.hash == "#Vitesse"){
        $("#conteneur").empty();
    }else if(window.location.hash == "#Precipitation"){
        $("#conteneur").empty();
    }
}
whenHashChange();

window.addEventListener('hashchange', whenHashChange);