# Smoelenboek

Creates an HTML face book page with photos based on an excel list with people.

This tool is specifically created to run locally in the browser so that non-technical people can use it without having 
to go through complex installations and finding hosting.  
  
NOTE: This has nothing to do with Facebook, it's an actual face book in the meaning of the words before the Facebook era.

### Requirements
Google Chrome

### Installation
* Clone the source-code into your computer.
* Add the people's photos in a folder called "Pasfotos" using JohnDoe.jpg as filename
  the folder should be in the root's parent folder, so ../Pasfotos

### Usage
* Open Make-Face-Book.html in Google Chrome
* Copy the excel template and add the employees without changing the structure
* Copy-paste the orange columns A-H from Excel into the textarea
* Drag the teams in the correct order
* Click "Maak Smoelenboek"
* Click "Printen" and print or save as PDF

### Employee list structure
People can be members of multiple teams. In that case, comma-separate them in the team column.  
The face book is created per team so people on multiple teams will appear for each team they are on.

### Making changes
The cover page is in js/coverPage.js and contains a page-covering image stored in images/cover.jpg.
The info page is in js/infoPage.js and is simply html packaged in javascript making it easy to edit.
The stylesheet of the output can be modified in css/smoelenboek.css.

### License
[GNU](https://github.com/bbreukelen/smoelenboek/blob/master/LICENSE)

### Author
Created by Boudewijn van Breukelen @ Future Software