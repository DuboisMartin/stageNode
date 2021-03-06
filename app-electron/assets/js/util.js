var ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('loaded-return', function(arg, data) {
    document.getElementById('bod').insertAdjacentHTML('beforeend', data);
});

ipcRenderer.on("SeeCapteurs-return", function(arg, data) {
    document.getElementById("bodyCapteur").insertAdjacentHTML('beforeend', data);
});

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
};

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};

ipcRenderer.on('event-return', function(arg, data, baseReq) {
    console.log('event-return');
    if(baseReq == "See"){
        var raw_data = String(JSON.parse(data.substring(1, data.length-1)).raw_data.data).split(',');
        let div = document.getElementById("print");
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
        document.getElementById("print").appendChild(document.createElement('pre')).innerHTML = syntaxHighlight(ab2str(raw_data));
    }else if(baseReq == "Save"){
        let myNotification = new Notification('Save', {
            body: 'Configuration saved!'
          });        
    }else if(baseReq == "Delete"){
        let myNotification = new Notification('Delete', {
            body: 'Deleted!'
          });
    }
});

window.onload= function() {
    ipcRenderer.send('loaded');
};

document.getElementById("navConfiguration").addEventListener("click", function(){
    document.getElementById("navCapteurs").classList.remove("active");
    document.getElementById("navConfiguration").classList.add("active");
    document.getElementById("Conf").style.display = "block";
    document.getElementById("Capteurs").style.display = "none";
});

document.getElementById("navCapteurs").addEventListener("click", function(){
    document.getElementById("navCapteurs").classList.add("active");
    document.getElementById("navConfiguration").classList.remove("active");
    document.getElementById("Conf").style.display = "none";
    document.getElementById("Capteurs").style.display = "block";
    document.getElementById("bodyCapteur").innerHTML = "";
    ipcRenderer.send("SeeCapteurs");

});

document.getElementById("navCapteursList").addEventListener("click", function(){
    document.getElementById("navCapteursList").classList.add("active");
    document.getElementById("navCapteursNew").classList.remove("active");
    document.getElementById("divCapteursList").style.display = "block";
    document.getElementById("divCapteursNew").style.display = "none";
    document.getElementById("bodyCapteur").innerHTML = "";
    ipcRenderer.send("SeeCapteurs");
});

document.getElementById("navCapteursNew").addEventListener("click", function(){
    document.getElementById("navCapteursList").classList.remove("active");
    document.getElementById("navCapteursNew").classList.add("active");
    document.getElementById("divCapteursList").style.display = "none";
    document.getElementById("divCapteursNew").style.display = "block";
});

document.getElementById("validCapteur").addEventListener("click", function() {
    var id = document.getElementById("idSelect").value;
    if(id != "." && id != undefined){
        var alias = document.getElementById("inputAlias").value;
        var desc = document.getElementById("inputDescription").value;
        var unit = document.getElementById("inputUnit").value;
        var etc = document.getElementById("inputEtc").value;
        console.log(id+":"+alias+":"+desc+":"+unit+":"+etc);
        ipcRenderer.send("validCapteur", String(id+":"+alias+":"+desc+":"+unit+":"+etc));
    }
});