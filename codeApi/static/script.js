

function whenHashChange(){
    if(window.location.hash == "#Home"){
        $("#conteneur").empty();
        $("#conteneur").load("contenuHome.html");
    }else if(window.location.hash == "#Temperature"){
        $("#conteneur").empty();
        $("#conteneur").load("contenuTemp.html");
    }else if(window.location.hash == "#Vitesse"){
        $("#conteneur").empty();
    }else if(window.location.hash == "#Precipitation"){
        $("#conteneur").empty();
    }else if(window.location.hash == "#Statistique"){
        $("#conteneur").empty();
        $("#conteneur").load("contenuStat.html");
    }
}
whenHashChange();

window.addEventListener('hashchange', whenHashChange);