const fs=require('fs'),remote=require('electron').remote,dialog=remote.dialog;
window.global={};

(function(global){
    global.filter=(input)=>{
        let table=document.getElementById("vars");
        let filter=input.toUpperCase();
        let tr = table.getElementsByTagName("tr");
        [...tr].forEach(row=>{
            let td = row.getElementsByTagName("td")[0];
            let val = td.innerHTML.toUpperCase();
            (val.toUpperCase().indexOf(input)>-1)?row.display="":row.display="none";
        });
    }

    global.openFile=()=>{
        dialog.showOpenDialogSync(function(filenames){
            var filename=filenames[0];
            console.log(filename)
            if (filename!==undefined&&fs.existsSync(filename)){
                global.style_file=filename;
                global.readStyles();
            }
        })
    }

    global.validTextColour=(stringToTest)=>{
        //Alter the following conditions according to your need.
        if (stringToTest === "") { return false; }
        if (stringToTest === "inherit") { return false; }
        if (stringToTest === "transparent") { return false; }
        
        var image = document.createElement("img");
        image.style.color = "rgb(0, 0, 0)";
        image.style.color = stringToTest;
        if (image.style.color !== "rgb(0, 0, 0)") { return true; }
        image.style.color = "rgb(255, 255, 255)";
        image.style.color = stringToTest;
        return image.style.color !== "rgb(255, 255, 255)";
    }

    global.refreshDOM=()=>{
        if (global.sf){
            var vars_node=document.getElementById("vars");
            vars.innerHTML=Object.keys(global.sf).map(style=>{
                let colour='transparent';
                if (global.validTextColour(global.sf[style]))colour=global.sf[style];
                else if (preview=global.sf[style].match(/(^@[A-z0-9]+)/gm)){
                    // try looking up
                    let variable=global.sf[preview[0].slice(1)];
                    if (variable&&global.validTextColour(variable)){
                        colour=variable;
                    }
                }
                let tr=`<tr>`
                tr+=`<td>${style}</td>`
                tr+=`<td><input class="var-value form-control" oninput="global.updateField('${style}',this.value)" type="text" value="${global.sf[style]}" /></td>`
                tr+=`<td><div class="preview" style="background-color:${colour};" /></td>`
                tr+=`</tr>`;
                return tr;
            }).join('\n');
        }
    }

    global.updateField=(style,value)=>{
        if (global.sf){
            global.sf[style]=value;
            console.log(style+" changed to "+value);
        }
    }

    global.saveFile=()=>{
        if (global.sf&&global.style_file){
            // SERIALISE
            var file_out="";
            Object.keys(global.sf).forEach((style,i,a)=>{
                file_out+=`@${style}:${global.sf[style]};`;
                if (i!==(a.length-1))file_out+="\n";
            })
            fs.writeFileSync(global.style_file,file_out)
            global.readStyles();
        }
        else{
            alert("Error: Please open a file first!")
        }
    }

    global.readStyles=()=>{
        var { style_file } = global;
        try {
            if ( fs.existsSync(style_file) ){
                global.sf={};
                fs.readFileSync(style_file).toString()
                    .replace(/^\/\/.*$/mg,'')
                    .replace(/^\s*[\r\n]/gm,'')
                    .split('\n')
                    .map(ce=>{
                        return ce.slice(1)
                                .replace(';','')
                                .split(':');
        
                    })
                    .map(style=>{
                        global.sf[style[0]]=style[1];
                    });
                global.refreshDOM();
            }
        }
        catch (err){
            console.log(err);
        }
    }
})(window.global)
