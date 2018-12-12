/*
 * Created by Boudewijn van Breukelen at Dec 3rd 2018
 * Goal: Create smoelenboek output in html, easilly convertable to PDF using an excel sheet as input
 * Should run on any computer and easy to update the format for anyone with the slightest bit of html/css knowledge
 * Here we go...
 */

FBMaker = {

  // Configuration
  photoPath: "Pasfotos/", // Relative path to folder where the pasfoto's reside (add trailing /)

  // Mapping of the data fields in chronological order (case-sensitive using CamelCase)
  fieldMapping: [
    "Voornaam",
    "Achternaam",
    "Email",
    "Telefoon",
    "Type medewerker",
    "Teams",
    "Aanspreekpunt",
    "Functie"
  ],


  /////////////////////////////////////////////
  // No novices below this point :-D
  /////////////////////////////////////////////
  output: "",
  textAreaHeight: "",

  make: function() {
    this.hideInstr();

    // Collect input from textbox
    var data = $("#personeelInput").val();
    if (!data) return this.dataError();

    // Move raw data to structured data
    data = this.makeStructuredData(data);
    if (data === null || data[1] === null) return this.dataError();
    if (data[0] && data[0].length) return this.dataError(data[0]);
    data = data[1];

    this.output = "";
    this.addHeader(); // Add header
    this.addPeople(data); // Add people data
    this.addFooter(); // Add footer

    $("#printOutput").show();
    $("#output").html("").append($("<iframe frameborder='0'/>")).show();
    var iFrame = $("iframe")[0],
      iFrameDoc = iFrame.contentDocument || iFrame.contentWindow.document;
    iFrameDoc.write(this.output);
    iFrameDoc.close();

    setTimeout(function() {
      iFrame.height = (iFrameDoc.body.scrollHeight + 50).toFixed() + "px";
    }, 500);


    this.output = "";
  },

  addHeader: function() {
    this.output += '<!DOCTYPE html>\n' +
           '<html lang="nl">\n' +
           '<head>\n' +
           '<title>Leussinkbad Smoelenboek</title>\n' +
           '<meta charset="utf-8">\n' +
           '<meta http-equiv="content-type" content="text/html;charset=utf-8" />\n' +
           '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Open+Sans" />\n' +
           '<link rel="stylesheet" href="css/paper.css">\n' +
           '<link rel="stylesheet" type="text/css" href="css/smoelenboek.css" />\n' +
           '<style>@page { size: A4 }</style>' +
           '</head>\n' +
           '<body class="A4">';
  },

  addFooter: function() {
    this.output += '</body></html>';
  },

  openPage: function() {
    this.output += '<section class="sheet padding-7mm"><div class="peoplePage">';
  },

  closePage: function() {
    this.output +=  '</div></section>';
  },

  openTeam: function(team) {
    this.output += '<div class="team" data-team="' + team + '">';
  },

  closeTeam: function() {
    this.output +=  '<span class="clearfix"></span></div>';
  },

  addPeople: function(data) {
    var self = this,
      pageOpen = false,
      teamOpen = false,
      lastTeam = null,
      pageFull = false,
      bumpTeamcount = false,
      teamCount = 0,
      colCount = 0;

    // Go through teams
    Object.keys(data).forEach(function(team) {
      var people = self.sortTeam(team, data[team]);

      // Go through people in team
      people.forEach(function(p) {

        // Close what needs to be closed
        if (colCount >= 3) { colCount = 0; bumpTeamcount = true; }
        if (teamOpen && (lastTeam !== team || pageFull)) { self.closeTeam(); teamOpen = false; bumpTeamcount = true; colCount = 0; }
        if (bumpTeamcount) { bumpTeamcount = false; teamCount++; }
        if (teamCount >= 3) { teamCount = 0; pageFull = true; }
        if (pageOpen && pageFull) {
          if (teamOpen) { teamOpen = false; self.closeTeam(); }
          self.closePage(); pageOpen = false; pageFull = false; teamCount = 0;
        }

        // Open what needs to be opened
        if (!pageOpen) { self.openPage(); pageOpen = true; }
        if (!teamOpen) { self.openTeam(team); teamOpen = true; lastTeam = team; }

        self.output += self.makePerson(team, p).html();
        colCount++;

        console.log(p.Voornaam);
        console.log(pageOpen);
        console.log(teamOpen);
        console.log(lastTeam);
        console.log(pageFull);
        console.log(teamCount);
        console.log(colCount);
        console.log("-------------");
      });
    });

    if (teamOpen) self.closeTeam();
    if (pageOpen) self.closePage();
  },

  makePerson: function(team, p) {
    var teamLead = p.Aanspreekpunt.indexOf(team) > -1;
    return $("<div>").append(
        $("<div>")
        .addClass("person" + (teamLead ? " teamlead" : ""))
        .append(
          $("<div>")
            .addClass("photo")
            .append(
              $("<div>").css("background-image", "url('" + FBMaker.photoPath + p.photo + "'), url('" + FBMaker.photoPath + "_noface.jpg')")
            )
        )
        .append(
          $("<div>")
            .addClass("info")
            .append($("<div>").addClass("naam").html(p.Voornaam + " " + p.Achternaam))
            .append($("<div>").addClass("telefoon").html("T: " + p.Telefoon.replace("-", " ")))
            .append($("<div>").addClass("email").html("E: " + p.Email))
            .append($("<div>").addClass("functie").html(p.Functie))
        )
    );
  },

  makeStructuredData: function(data) {
    var self = this;
    data = data.split("\n");
    if (!data) return null;
    var teams = {},
      errors = [];

    data.forEach(function(personRaw) {
      if (!personRaw) return;
      var person = personRaw.split("\t");
      if (person.length < 2) return; // Skip
      var personO = self.personArrayToObject(person);
      if (!personO.Voornaam || !personO.Achternaam) {
        console && console.log(person);
        return errors.push("Regel: " + personRaw);
      }

      // Check teams
      if (personO.Teams) {
        personO.Teams.forEach(function(team) {
          if (teams[team] === undefined) { teams[team] = []; }
          teams[team].push(personO);
        });
      }
    });

    return [ errors, teams ];
  },

  personArrayToObject: function(p) {
    var out = {};
    p.forEach(function(f, index) {
      out[FBMaker.fieldMapping[index]] = f;
    });
    out.photo = makePhotoFileName(out);
    out.Aanspreekpunt = out.Aanspreekpunt.replace(";",",").split(",");
    out.Teams= out.Teams.replace(";",",").split(",");
    return out;
  },

  sortTeam: function(teamName, people) {
    return people.sort(function(a, b) {
      var aLead = a.Aanspreekpunt && a.Aanspreekpunt.indexOf(teamName) > -1,
          bLead = b.Aanspreekpunt && b.Aanspreekpunt.indexOf(teamName) > -1,
        aName = a.Voornaam + ' ' + a.Achternaam,
        bName = b.Voornaam + ' ' + b.Achternaam;
      if (aLead === bLead && aName === bName) return 0;
      if (aLead !== bLead) return aLead ? -1 : 1;
      return aName < bName ? -1 : 1;
    });
  },

  dataError: function(errors) {
    if (typeof errors === "undefined" || errors.length < 1) {
      alert("Onjuiste data ingevoerd");
    } else {
      alert("Probleem met de data:\n" + errors.join("\n"));
    }
  },

  print: function() {
    $("iframe")[0].contentWindow.print();
  },

  hideInstr: function() {
    $("#instructionsContent").slideUp();
    $("#instOpenBut").show();
    var ta = $("#personeelInput");
    this.textAreaHeight = ta.height();
    ta.css("height", "28px");
  },

  showInstr: function(e) {
    $("#instOpenBut").hide();
    $("#instructionsContent").slideDown();
    $("#personeelInput").css("height", (this.textAreaHeight || 100) + "px");
  }
};

$(function() {

  // Init buttons etc
  $("#generateBut").click(FBMaker.make.bind(FBMaker));
  $("#printOutput").click(FBMaker.print.bind(FBMaker));
  $("#instOpenBut").click(FBMaker.showInstr.bind(FBMaker));

  // Show fields from mapping in instructions
  $("#fields").html( FBMaker.fieldMapping.join(", ") );
});

function makePhotoFileName(person) {
  var photo = (person.Voornaam + " " + person.Achternaam).toLowerCase().replace(/\W+(.)/g, function (match, chr) {
    return chr.toUpperCase();
  });
  return photo.charAt(0).toUpperCase() + photo.slice(1) + ".jpg";
}