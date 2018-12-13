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
  teamsOrdered: [],

  make: function() {
    var self = this;
    $("#collapse1").collapse();

    // Save team ordering
    localStorage.setItem("teamsOrdered", JSON.stringify(FBMaker.teamsOrdered || []));

    this.getAndProcessData(function(err, data) {
      if (err) { return self.dataError(err); }

      self.output = "";
      self.addHeader(); // Add header
      self.addPeople(data); // Add people data
      self.addFooter(); // Add footer

      $("#printOutput").show();
      $("#output").html("").append($("<iframe frameborder='0'/>")).show();
      var iFrame = $("iframe")[0],
        iFrameDoc = iFrame.contentDocument || iFrame.contentWindow.document;
      iFrameDoc.write(self.output);
      iFrameDoc.close();

      setTimeout(function() {
        iFrame.height = (iFrameDoc.body.scrollHeight + 50).toFixed() + "px";
      }, 500);

      self.output = "";
    });
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
    this.output += '' +
      '<script src="js/photoResizer.js"></script>' +
      '</body></html>';
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
    self.teamsOrdered.forEach(function(team) {
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
              $("<canvas>")
                .attr("data-src-backup", FBMaker.photoPath + "_noface.jpg")
                .attr("data-src", FBMaker.photoPath + p.photo)
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

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Data handling
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  getAndProcessData: function(cb) {
    // Collect input from textbox
    var data = $("#personeelInput").val();
    if (!data) return cb([]);

    // Move raw data to structured data
    data = this.makeStructuredData(data);
    if (data === null || data[1] === null) return cb([]); // Returns error
    if (data[0] && data[0].length) return cb(this.dataError(data[0]));
    cb(null, data[1]);
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

  makeTeams: function() {
    // Updates list of teams
    var self = this;
    this.getAndProcessData(function(err, data) {
      var c = $("#teams").html(""); // set and empty
      if (err || !data) return; // Ignore errors

      var teams = Object.keys(data); // Get teams from data

      // Make order based on last order
      var orderTemp = self.teamsOrdered.filter((o) => teams.includes(o));
      self.teamsOrdered = orderTemp.concat(teams.filter((o) => !orderTemp.includes(o)));

      teams = null; data = null; // Clear mem

      self.teamsOrdered.forEach(function(team) {
        c.append($("<li>").addClass("list-group-item").text(team));
      });

      // Setup drag sorting
      if (self.teamsOrdered.length) {
        c
          .sortable('destroy')
          .sortable({placeholderClass: 'list-group-item'})
          .on('sortupdate', FBMaker.teamsSorted.bind(FBMaker));

        $("#saveSort").show();
      } else {
        $("#saveSort").hide();
      }
    });
  },

  teamsSorted: function() {
    // Store sorting in object and save for later
    this.teamsOrdered = $("#teams li").map(function() { return this.innerHTML; }).get();
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
  }
};

$(function() {

  // Init buttons etc
  $("#generateBut").click(FBMaker.make.bind(FBMaker));
  $("#printOutput").click(FBMaker.print.bind(FBMaker));

  // Show fields from mapping in instructions
  $("#fields").html( FBMaker.fieldMapping.join(", ") );

  // Update teams when changing members
  $("#personeelInput").on("input", FBMaker.makeTeams.bind(FBMaker)).trigger('input');

  // Pull last used teamOrdered
  try {
    FBMaker.teamsOrdered = JSON.parse(localStorage.getItem("teamsOrdered") || "[]");
  } catch (err) {
    FBMaker.teamsOrdered = [];
  }
});

function makePhotoFileName(person) {
  var photo = (person.Voornaam + " " + person.Achternaam).toLowerCase().replace(/\W+(.)/g, function (match, chr) {
    return chr.toUpperCase();
  });
  return photo.charAt(0).toUpperCase() + photo.slice(1) + ".jpg";
}