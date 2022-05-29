// ==UserScript==
// @name        Riven The Pet
// @description Creates a new speedrun pet
// @version     1.0.0
// ==/UserScript==

(() => {
    const load = () => {
      const isGameLoaded = (window.isLoaded && !window.currentlyCatchingUp) ||
        (typeof unsafeWindow !== 'undefined' && unsafeWindow.isLoaded && !unsafeWindow.currentlyCatchingUp);
        
      if (!isGameLoaded) {
        setTimeout(load, 50);
        return;
      }
  
      inject();
    }
    
    var createPetInLog = function(pet){
        const petContainer = document.getElementById('petlog-container').children[0];

        //Create the div container
        var div = document.createElement('div');
        div.id = "LR-Riven";
        div.classList.add('monster-item', 'no-bg', 'btn-light', 'pointer-enabled', 'm-1', 'justify-vertical-center');

        //Create the image
        var img = document.createElement('img');
        img.id = "LR-rivenPet";
        img.src = pet.media;
        img.metadata_for_pet = pet;

        img.classList.add('combat-enemy-img-sm', 'p-2');
        img.onclick = function(e){
            var metadata = document.getElementById(e.srcElement.id).metadata_for_pet;
            unlockPet(parseInt(metadata.location));
        };

        //Add the image to the container
        div.appendChild(img);

        //Add the div container to the pet container
        petContainer.appendChild(div);
    };

    var formatHelper = function(valToFormat, type, sign){
        var formattedVal = "";

        //Handle the formatting of the value itself
        if(valToFormat && type){
            if(type === "per"){
                formattedVal = valToFormat.toString() + "%"
            }
            else if(type === "ms"){
                var msToS = Math.round(valToFormat/1000*1000)/1000;
                formattedVal = msToS.toString() + " seconds";
            }
            else{
                formattedVal = valToFormat.toString();
            }
        }
        

        //Handle the sign
        if(sign){
            formattedVal = sign + formattedVal;
        }

        return formattedVal;
    };
    
    var formatter = function(valArray){
        //Start empty
        var formattedVal = "";

        //Handle the different types of values
        if(valArray){
            var val;
            var type = valArray[1];
            var sign = valArray[2];
            if(valArray[0] !== null && Array.isArray(valArray[0])){
                val = valArray[0][1];
                formattedVal = formatHelper(val, type, sign);
            }
            else if(valArray[0] !== null){
                val = valArray[0];
                formattedVal = formatHelper(val, type, sign);
            }    
        }

        return formattedVal;
    };

    //Format
    // [expectedValue, type, sign] - handled types (per(%), ms(ms), num())
    // for arrays <key> is the property/title, expectedValue is the value
    var mods = {
        "skills" : {
            "title" : "Skill Modifiers",
            "decreasedSkillIntervalPercent" : {
                "Woodcutting" : [[Skills.Woodcutting, 120], "per", "-"],
                "Fishing" : [[Skills.Fishing,120], "per", "-"],
                "Firemaking" : [[Skills.Firemaking,80], "per", "-"],
                "Cooking" : [[Skills.Cooking,80], "per", "-"],
                "Mining" : [[Skills.Mining,130], "per", "-"],
                "Smithing" : [[Skills.Smithing,80], "per", "-"],
                "Thieving" : [[Skills.Thieving,90], "per", "-"],
                "Farming" : [[Skills.Farming,80], "per", "-"],
                "Fletching" : [[Skills.Fletching,80], "per", "-"],
                "Crafting" : [[Skills.Crafting,80], "per", "-"],
                "Runecrafting" : [[Skills.Runecrafting,90], "per", "-"],
                "Herblore" : [[Skills.Herblore,90], "per", "-"],
                "Agility" : [[Skills.Agility,90], "per", "-"],
                "Summoning" : [[Skills.Summoning,90], "per", "-"],
                "Astrology" : [[Skills.Astrology,90], "per", "-"]
            }
        },
        "player" : {
            "title" : "Player Modifiers",
            "decreasedAttackIntervalPercent" : {
                "title" : "Player Attack Interval Reduction %",
                "values" : [200, "per", "-"]
            },
            "decreasedMonsterRespawnTimer" : {
                "title" : "Monster Respawn Reduction",
                "values" : [2700, "ms", "-"]
            },
            "increasedMinHitBasedOnMaxHit" : {
                "title" : "Increased Min Hit Based On Max Hit",
                "values" : [50, "per", "+"]
            },
            "increasedGlobalAccuracy" : {
                "title" : "Increased Global Accuracy",
                "values" : [50, "per", "+"]
            },
            "increasedThievingStealth" : {
                "title" : "Increased Stealth",
                "values" : [5000, "num", "+"]
            }
        }
    };
    
    var createPetObjectArray = function(modLoc, property){
        var arr = [];
        if(modLoc && property){
            for(const [key,value] of Object.entries(modLoc[property])){
                if(key && value){
                    arr.push(modLoc[property][key][0]);
                }
            }
        }
        return arr;
    }

    //Dynamic section creator, makes it personal to the type of mod it is
    var createSection = function(sectionProps, isArr){
        //metadata info to be ignored
        var reserved = ["title"];

        //Header
        var section = "";
        
        //Skills require an array of arrays, this handles it
        if(isArr){
            section = `<br><h5 class="font-w400 font-size-sm mb-1">${sectionProps.title}</h5><br>`;
            for (const [key, value] of Object.entries(sectionProps)){
                if(reserved.indexOf(key) === -1){
                    for(const[innerKey, innerValue] of Object.entries(sectionProps[key])){
                        section += `<h5 class="font-w400 font-size-sm mb-1 text-success">${innerKey}: ${formatter(innerValue)} </h5>`;
                    }
                }
            }
        }
        //Else just use the standard way of doing things
        else{
            section = `<br><h5 class="font-w400 font-size-sm mb-1">${sectionProps.title}</h5><br>`;
            for (const [key, value] of Object.entries(sectionProps)) {
                if(reserved.indexOf(key) === -1){
                    section += `<h5 class="font-w400 font-size-sm mb-1 text-success">${value.title}: ${formatter(value.values)} </h5>`;
                }
            }
        }

        return section;
    };

    //Creates the description for the pet unlock
    var createDescription = function(){
        //Create the heading element
        var desc = '<div class="h5 font-w400 text-info text-center m-1 mb-2">Custom Speedrun Pet</div>';
        desc += createSection(mods.player, false);
        desc += createSection(mods.skills, true);
        return desc;
    };
  
    const inject = () => {
        //Riven my speedrunning pet
        var riven = {
            "html_img_id" : "LR-rivenPet",  
            "name":"Riven",
            "description":createDescription(),
            "media":"https://i.imgur.com/WQwABCM.png",
            "acquiredBy":"Being Cool",
            "modifiers":{
                "decreasedSkillIntervalPercent": createPetObjectArray(mods.skills,"decreasedSkillIntervalPercent"),
                "decreasedAttackIntervalPercent": mods.player["decreasedAttackIntervalPercent"].values[0],
                "decreasedMonsterRespawnTimer" : mods.player["decreasedMonsterRespawnTimer"].values[0],
                "increasedMinHitBasedOnMaxHit" : mods.player["increasedMinHitBasedOnMaxHit"].values[0],
                "increasedGlobalAccuracy" : mods.player["increasedGlobalAccuracy"].values[0],
                "increasedThievingStealth" : mods.player["increasedThievingStealth"].values[0]
            },
            "activeInRaid":false
        };

        //Get the total amount of pets and add riven to the end
        var curLen = JSON.stringify(PETS.length);
        riven.location = curLen;
        PETS.push(riven);

        //Unlock the pet
        unlockPet(parseInt(curLen));

        //Add to container
        createPetInLog(riven);

        //Make sure player modifiers are updated
        updateAllPlayerModifiers();
    }
  
    load();
  })();
