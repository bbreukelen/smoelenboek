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

  make: function() {
    // Collect input from textbox
    var data = $("#personeelInput").val();
    if (!data) return this.dataError();

    // Move raw data to structured data
    data = this.makeStructuredData(data);
    if (data === null || data[1] === null) return this.dataError();
    if (data[0] && data[0].length) return this.dataError(data[0]);
    data = data[1];

    var output = "";
    // Add header
    output += this.addHeader();

    // Add people data
    output += this.addPeople(data);

    // Add footer
    output += this.addFooter();

    $("#printOutput").show();
    $("#output").html("").append($("<iframe frameborder='0'/>")).show();
    var iFrameDoc = $("iframe")[0].contentDocument || $("iframe")[0].contentWindow.document;
    iFrameDoc.write(output);
    iFrameDoc.close();
  },

  addHeader: function() {
    return '<!DOCTYPE html>\n' +
           '<html lang="nl">\n' +
           '<head>\n' +
           '<title>Leussinkbad Smoelenboek</title>\n' +
           '<meta charset="utf-8">\n' +
           '<meta http-equiv="content-type" content="text/html;charset=utf-8" />\n' +
           '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Open+Sans" />\n' +
           '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.css">\n' +
           '<link rel="stylesheet" type="text/css" href="css/smoelenboek.css" />\n' +
           '<style>@page { size: A4 }</style>' +
           '</head>\n' +
           '<body class="A4">' +
           '<section class="sheet padding-10mm">';
  },

  addFooter: function() {
    return '</body></html>';
  },

  addPeople: function(data) {
    var self = this,
      o = '<div class="people">';
    data.forEach(function(p) {
      o += self.makePerson(p).html();
    });
    o += '</div>';
    return o;
  },

  makePerson: function(p) {
    return $("<div>").append(
        $("<div>")
        .addClass("person")
        .append(
          $("<div>")
            .addClass("photo")
            .append(
              $("<div>").css("background-image", "url('" + FBMaker.photoPath + p.photo + "')")
            )
        )
        .append(
          $("<div>")
            .addClass("info")
            .append($("<div>").addClass("naam").html(p.Voornaam + " " + p.Achternaam))
            .append($("<div>").addClass("aanspreekpunt").html("Team aanspreekpunt"))
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
    var persons = [],
      errors = [];
    data.forEach(function(personRaw) {
      if (!personRaw) return;
      var person = personRaw.split("\t");
      if (person.length < 2) return; // Skip
      if (person.length !== FBMaker.fieldMapping.length) {
        console && console.log(person);
        return errors.push("Regel: " + personRaw);
      }
      persons.push(self.personArrayToObject(person));
    });

    return [ errors, persons ];
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
});

function makePhotoFileName(person) {
  var photo = (person.Voornaam + " " + person.Achternaam).toLowerCase().replace(/\W+(.)/g, function (match, chr) {
    return chr.toUpperCase();
  });
  return photo.charAt(0).toUpperCase() + photo.slice(1) + ".jpg";
}