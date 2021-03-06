function insertStylesheet() {
    var text = [
        "body { background-color: #0F0F0F; border-collapse: collapse; color: #A38D6D; font-family: Verdana; font-size: 14px; }",
        "h1, h2 { margin: 15px; }",

        ".stash { background-color: #26231B; border: 1px solid #1A1812; }",
        "#headerRow { backgronud-color: #332f24; color: #DFCF99; }",
        "#headerRow th { cursor: pointer; font-size: 14px; padding: 4px; text-align: center; }",

        "table.stash tr > td, #stash tr > th { background-color: #211F18; border: 1px solid #1A1812; color: #DFCF99; }",
        "table.stash .oddRow { background-color: #26231B; }",
        "table.stash td { color: #A38D6D; font-size: 12; padding: 4px; text-align: center; }",

        "table.stash .title { color: #F2C462; }",
        "table.stash img { height: 40px; }",
        "table.stash .mods { color: #A38D6D; }",
        "table.stash .unidentified { color: #833; margin: 4px; }",
        "table.stash .unparsed {font-style: italic}",

        "table.stash .sockets .D { color: #719e13; }",
        "table.stash .sockets .I { color: #114181; }",
        "table.stash .sockets .S { color: #9e1328; }",

        "table.stash .unique { color: #af6025; }",
        "table.stash .rare { color: #f4f371; }",
        "table.stash .magic { color: #6b6bc8; }",
        "table.stash .normal { color: #b8b8b8; }",

        "table.stash .fire { color: #960000; }",
        "table.stash .cold { color: #366492; }",
        "table.stash .lightning { color: #e1be00; }"

    ].join('\n\n');

    var style = window.document.createElement("style");
    $("head")[0].appendChild(style);
    style.innerHTML = text;
}

var existingItems = [];

var ready = function () {
    insertStylesheet();

    if ($("pre").length > 0) {
        existingItems = JSON.parse($("pre").html()).items;
    }

    $("body").html("<h2>Loading...</h2>");

    requestStashData("Standard");
};


//function addStashTab(totalItems, tabNumber) {
//    $.ajax({
//        url: "http://www.pathofexile.com/character-window/get-stash-items?league=Standard&tabs=0&tabIndex=" + tabNumber,
// 
//        success: function(data) {
//            if (data == "false") {
//               buildPage(totalItems);
//            } else {
//               var newItems = JSON.parse(data).items;
//               totalItems = totalItems.concat(newItems);
// 
//               addStashTab(totalItems, tabNumber + 1);
//            }
//    }});
//}

var stashData = {};

function buildPage(items) {
    $("body").html("");
    var title = document.createElement("h1");
    title.innerHTML = "Stash Inventory";
    $("body")[0].appendChild(title);

    var gems = [];
    var currency = [];
    var flasks = [];
    var rings = [];
    var amulets = [];
    var gear = [];

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemType = item.frameType;

        if (itemType == 5) {
            currency.push(item);
        } else if (itemType == 4) {
            gems.push(item);
        } else {
            var name = item.typeLine;
            if (isFlask(name)) {
                flasks.push(item);
            } else if (isRing(name)) {
                rings.push(item);
            } else if (isAmulet(name)) {
                amulets.push(item);
            } else {
                gear.push(item);
            }
        }
    }

    buildTable(gems, "Gems", "gems");
    buildTable(currency, "Currency", "currency");
    buildTable(flasks, "Flasks", "flasks");
    buildTable(rings, "Rings", "rings");
    buildTable(amulets, "Amulets", "amulets");
    buildTable(gear, "Gear", "gear");
}

function isFlask(name) {
    return name.match(/Flask/) != null;
}

function isRing(name) {
    return name.match(/Ring/) != null;
}

function isAmulet(name) {
    return name.match(/Amulet/) != null;
}

var Mods = {
    "Adds (\\d+)-(\\d+) Physical Damage": "Physical Damage",
    "Adds (\\d+)-(\\d+) Cold Damage": "Cold Damage",
    "Adds (\\d+)-(\\d+) Lightning Damage": "Lightning Damage",
    "Adds (\\d+)-(\\d+) Fire Damage": "Fire Damage",
    "(\\d+)% Increased Physical Damage": "+% Local Physical Damage",
    "(\\d+)% Increased Critical Strike Chance": "+% Local Critical Strike",
    "(\\d+)% Increased Attack Speed": "+% Local Attack Speed"
};

function parseMods(descriptions) {
    function parseMod(description) {
        var generic = description.replace(/\d+/g, "(\\d+)");

        if (typeof Mods[generic] !== "undefined") {
            return {
                "name": Mods[generic],
                "description": description,
                "values": description.match(generic).slice(1),
                "parsed": true
            }
        }

        return {
            "name": description,
            "description": description,
            "parsed": false
        };
    }

    var mods = {};

    for (var i in descriptions) {
        var mod = parseMod(descriptions[i]);
        mods[mod.name] = mod;
    }

    return mods;
}


function buildTable(items, titleText, idName) {
    if (items.length == 0) return;

    var box = document.createElement("div");

    var title = document.createElement("h2");
    title.innerHTML = titleText;
    box.appendChild(title);

    var table = document.createElement("table");
    table.id = idName;
    table.className = "stash";

    var headers = ["", "Name", "Level", "Mods"];

    if (idName == "gear") {
        var gearHeaders = ["Sockets"];
        headers = headers.concat(gearHeaders);
        var weaponHeaders = ["DPS", "DPS-Increase", "Physical", "Fire", "Cold", "Lightning"];
        headers = headers.concat(weaponHeaders);
    }

    createHeaders(table, headers);

    var rows = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        item.implicitMods = parseMods(item.implicitMods);
        item.explicitMods = parseMods(item.explicitMods);

        var row = newRow();
        row.className = i % 2 == 0 ? 'evenRow' : 'oddRow';

        createImageCell(row, item);
        createTitleCell(row, item);
        createLevelCell(row, item);
        createModsCell(row, item);

        if (idName == "gear") {
            createSocketsCell(row, item);
            addWeaponsDetails(row, item);
        }

        rows.push({
            "item": item,
            "row": row
        });
        //table.appendChild(row);
    }

    rows.sort(function (a, b) {
        //	return a.item.typeLine.localeCompare(b.item.typeLine);
        return parseInt(getRequirement(a.item, "Level")) - parseInt(getRequirement(b.item, "Level"));
    });

    for (var i = 0; i < rows.length; i++) {
        table.appendChild(rows[i].row);
    }


    box.appendChild(table);
    $("body")[0].appendChild(box);

    attachHandlers();
}

function addWeaponsDetails(row, item) {
    // weapon details if applicable

    var weaponInfo = getWeaponInfo(item);
    if (weaponInfo) {
        appendNewCellWithTextAndClass(row, weaponInfo.dps.toFixed(1), "dps");
        appendNewCellWithTextAndClass(row, weaponInfo.pIncreaseDps.toFixed(1) + " %", "pIncreaseDps");

        appendNewCellWithTextAndClass(row, weaponInfo.physical.label, "physical");
        appendNewCellWithTextAndClass(row, weaponInfo.fire ? weaponInfo.fire.label : "", "fire");
        appendNewCellWithTextAndClass(row, weaponInfo.cold ? weaponInfo.cold.label : "", "cold");

        appendNewCellWithTextAndClass(row, weaponInfo.lightning ? weaponInfo.lightning.label : "", "lightning")
    } else {
        var td = newCell();
        td.colSpan = 6;
        row.appendChild(td);

    }
}

function appendNewCellWithTextAndClass(row, text, className) {
    var td = newCell();
    td.className = className;
    if (text) {
        td.innerHTML = text;
    }
    row.appendChild(td);

}

function createHeaders(table, headers) {
    var headerRow = newRow();
    headerRow.id = "headerRow";
    for (var i = 0; i < headers.length; i++) {
        var td = document.createElement("th");

        td.id = headers[i].toLowerCase();
        td.innerHTML = headers[i];
        headerRow.appendChild(td);
    }
    table.appendChild(headerRow);
}

function createImageCell(row, item) {
    var td = newCell();
    var img = document.createElement("img");
    img.src = item.icon;
    img.title = item.descrText;
    td.appendChild(img);
    row.appendChild(td);
}

function createTitleCell(row, item) {
    var td = newCell();

    var t = item.frameType;
    var type = t == 3 ? "unique" : t == 2 ? "rare" : t == 1 ? "magic" : "normal";
    td.className = "title " + type;
    td.title = item.inventoryId;

    var title = "";
    if (item.name) {
        title += "<strong>" + item.name + "</strong><br />";
    }
    td.innerHTML = title + item.typeLine;

    row.appendChild(td);
}


function createModsCell(row, item) {
    var td = newCell();
    td.className = "mods";
    var implicit = getModsText(item.implicitMods);

    var explicit = getModsText(item.explicitMods);
    var text = implicit;
    if (implicit.length > 0 && explicit.length > 0) {
        text += "<br /><br />";
    }
    text += explicit;

    if (!item.identified) {
        text += "<span class='unidentified'>UNIDENTIFIED</span>";
    }

    td.innerHTML = text;
    row.appendChild(td);
}

function getModFormat(mod) {
    if (!mod.parsed)
        return "<span class='unparsed'>" + mod.description + "</span>";
    return "<span>" + mod.description + "</span>";
}

function getModsText(mods) {
    var modsText = "";
    var modNames = Object.keys(mods);

    if (mods && modNames.length > 0) {
        modsText = getModFormat(mods[modNames[0]]);
        for (var j = 1; j < modNames.length; ++j) {
            modsText += "<br />" + getModFormat(mods[modNames[j]]);
        }
    }
    return modsText;
}

function createSocketsCell(row, item) {
    var td = newCell();
    td.className = "sockets";

    if (item.sockets) {
        var groups = new Array();
        for (var i = 0; i < item.sockets.length; i++) {
            var socket = item.sockets[i];
            var text = "<span class='" + socket.attr + "'>" + socket.attr + "</span>";

            if (groups[socket.group]) {
                text = groups[socket.group] + "-" + text;
            }
            groups[socket.group] = text;
        }

        var text = "";

        for (var i = 0; i < groups.length; i++) {
            text += groups[i] + "<br />";
        }
        td.innerHTML = text;
    }
    row.appendChild(td);
}

function getRequirement(item, type) {
    if (item.requirements) {
        for (var i = 0; i < item.requirements.length; i++) {
            var req = item.requirements[i];
            if (req["name"] == type) {
                return req["values"][0][0];
            }
        }
    }
    return 0;
}

function createLevelCell(row, item) {
    var level = getRequirement(item, "Level");
    appendNewCellWithTextAndClass(row, level, "level");
}

function newRow() {
    return document.createElement("tr");
}

function newCell() {
    return document.createElement("td");
}

function attachHandlers() {
    $("#stash th").click(function () {

        var col = $(this).id;
        // TODO: sort...
    });
}

/*
    WeaponInfo
        - name
        - baseItem
        - baseWeaponDps
        - attacksPerSecond
        - dps
 
        - physical
        - fire
        - cold
 
        - lightning
*/

function getWeaponBaseName(typeLine) {
    var name = typeLine;

    if (typeof baseWeapons[name] !== "undefined") return name;

    // search for and remove suffix
    var end = name.indexOf(" of ");
    if (end != -1) name = name.substring(0, end);

    if (typeof baseWeapons[name] !== "undefined") return name;

    // iteratively remove prefixes
    var start = 0;
    while ((start = name.indexOf(" ", start)) != -1) {
        name = name.substring(start + 1);

        if (typeof baseWeapons[name] !== "undefined") return name;
    }

    return typeLine;
}

function getWeaponInfo(item) {
    var baseWeapon = baseWeapons[getWeaponBaseName(item.typeLine)];

    if (baseWeapon == null) {
        return null;
    }

    var weaponInfo = {};

    weaponInfo.name = item.name;
    weaponInfo.baseItem = baseWeapon["Name"];

    weaponInfo.baseWeaponDps = ((baseWeapon["DamageMin"] + baseWeapon["DamageMax"]) / 2 * baseWeapon["AttacksPerSecond"]).toFixed(1);


    addWeaponDamages(item, weaponInfo);


    weaponInfo.attacksPerSecond = parseFloat(getItemProperty(item, "Attacks per Second").values[0][0]);
    weaponInfo.dps = weaponInfo.attacksPerSecond * weaponInfo.aggregateDamage.avg;
    weaponInfo.pIncreaseDps = weaponInfo.dps / weaponInfo.baseWeaponDps * 100;

    return weaponInfo;
}

function addWeaponDamages(item, weaponInfo) {
    var physicalDamage = getItemProperty(item, "Physical Damage");
    weaponInfo.physical = getValueRange(physicalDamage.values[0][0]);



    weaponInfo.aggregateDamage = getValueRange(physicalDamage.values[0][0]);

    var elementalDamages = getItemProperty(item, "Elemental Damage");
    if (elementalDamages != null) {

        for (var i in elementalDamages.values) {

            elementalDamage = elementalDamages.values[i];
            range = getValueRange(elementalDamage[0]);
            if (elementalDamage[1] == 4) {

                weaponInfo.fire = range;
            } else if (elementalDamage[1] == 5) {

                weaponInfo.cold = range;
            } else if (elementalDamage[1] == 6) {
                weaponInfo.lightning = range;

            }

            weaponInfo.aggregateDamage.min += range.min;

            weaponInfo.aggregateDamage.max += range.max;
            weaponInfo.aggregateDamage.avg += range.avg;
        }

    }
}

function getItemProperty(item, desiredProperty) {
    var properties = item.properties;

    for (var i in properties) {
        property = properties[i];
        if (property.name == desiredProperty) {

            return property;
        }
    }
}

function getValueRange(rangeString) {
    var range = {};
    var values = rangeString.split("-");
    range.min = parseInt(values[0]);

    range.max = parseInt(values[1]);
    range.avg = ((range.min + range.max) / 2);
    range.label = rangeString

    return range;
}

var LZW = {
    compress: function (uncompressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = {},
            c,
            wc,
            w = "",
            result = [],
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[String.fromCharCode(i)] = i;
        }
 
        for (i = 0; i < uncompressed.length; i += 1) {
            c = uncompressed.charAt(i);
            wc = w + c;
            //Do not use dictionary[wc] because javascript arrays 
            //will return values for array['pop'], array['push'] etc
           // if (dictionary[wc]) {
            if (dictionary.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                // Add wc to the dictionary.
                dictionary[wc] = dictSize++;
                w = String(c);
            }
        }
 
        // Output the code for w.
        if (w !== "") {
            result.push(dictionary[w]);
        }
        return result;
    },
 
 
    decompress: function (compressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = [],
            w,
            result,
            k,
            entry = "",
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[i] = String.fromCharCode(i);
        }
 
        w = String.fromCharCode(compressed[0]);
        result = w;
        for (i = 1; i < compressed.length; i += 1) {
            k = compressed[i];
            if (dictionary[k]) {
                entry = dictionary[k];
            } else {
                if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }
 
            result += entry;
 
            // Add w+entry[0] to the dictionary.
            dictionary[dictSize++] = w + entry.charAt(0);
 
            w = entry;
        }
        return result;
    }
};