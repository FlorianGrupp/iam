/*  This file provides base functionalities which can be used by any class */

/**
 * 
 * @param {Number} number
 * @param {Number} decimals
 * @returns {String} specified number rounded according to specified decimals and transformed into the locale string representation of the number
 */
export function formatNumber(number,decimals) {
    if (number) {
        const rounded = roundNumber(number,decimals);
        let str = rounded.toLocaleString();
        if (str === '-0') {
            str = '0';
        }
        return str;    
    }
    return number;
}

/**
 * 
 * @param {Number} number
 * @param {Number} decimals
 * @returns {Number} specified number rounded according to specified decimals (or 2, if not specified)
 */
export function roundNumber(number,decimals=2) {
    return Math.round((parseFloat(number) + Number.EPSILON) * Math.pow(10,decimals)) / Math.pow(10,decimals);
}

/**
 * 
 * @param {Number} y year
 * @param {Number} m month
 * @param {Number} d day
 * @param {String} stringNoYear
 * @returns {String} transforms the given, day, month and year parameters into a locale date string
 */
export function formatDate(y, m, d, stringNoYear) {
        if (!y) {
            return (!stringNoYear) ? '?' : IAMTranslatorFactory.getMsg(stringNoYear);
        }
        
        const year = y ? parseInt(y) : NaN;
        const month = m ? parseInt(m)-1 : NaN;
        const day = d ? parseInt(d) : NaN;
 
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return d + '.' + m + '.' + y;
        }
        const date = new Date(year, month, day);
        return date.toLocaleDateString(undefined,{year: 'numeric', month: '2-digit', day: '2-digit'});
}

/**
 * Basic translator class. It stores the texts required by the interactive map including the translation into a language in a Map. For each language, there is a Map. Currently, only English and erman are implemented. This class should be replaced by a standard multi-lingual template that stores the texts in aseparate file
 * @type IAMTranslator
 */
class IAMTranslator {
    lang = 'en';
    messages;
    
    constructor (lang = this.getUserLang()) {
        this.lang = lang;
        this.messages = new Map();
        
        const messagesEN = new Map();
        messagesEN.set('','');
        messagesEN.set("Show","Show");
        messagesEN.set("Save","Save");
        messagesEN.set("Add","Add");
        messagesEN.set("Cancel","Cancel");
        messagesEN.set("Delete","Delete");
        messagesEN.set("Overwrite","Overwrite");
        messagesEN.set("Search","Search");
        messagesEN.set("Edit","Edit");
        messagesEN.set("File Name","File Name");
        messagesEN.set("None","None");
        messagesEN.set("No results","No results");
        messagesEN.set("Too many results","Too many results");
        messagesEN.set("Search Results","Search Results");
        messagesEN.set("Sort ascending","Sort ascending");
        messagesEN.set("Sort descending","Sort descending");
        messagesEN.set("Name","Name");
        messagesEN.set("Length","Length");
        messagesEN.set("Date","Date");
        messagesEN.set("today","today");
        messagesEN.set("Year","Year");
        messagesEN.set("Type","Type");
        messagesEN.set("Yes","Yes");
        messagesEN.set("No","No");
        
        messagesEN.set("Point","Point");
        messagesEN.set("LineString","Line");
        messagesEN.set("Polygon","Polygon");
        messagesEN.set("Focus on map","Focus on map");
        messagesEN.set("Feature type","Feature type");
        messagesEN.set("Attribute name","Attribute name");
        messagesEN.set("Attribute value","Attribute value");
        messagesEN.set("From year","From year");
        messagesEN.set("To year","To year");



        messagesEN.set("Import data","Import data");
        messagesEN.set("Export data","Export data");
        messagesEN.set("Change feature settings","Change feature settings");
        messagesEN.set("Change time settings","Change time settings");
        messagesEN.set("Search feature","Search feature");
        messagesEN.set("Table view","Table view");
        messagesEN.set("Chart view","Chart view");
        
        /* map side menu tiles */
        messagesEN.set("Edit map settings","Edit map settings");
        messagesEN.set("Export map to image file","Export map to image file");
        messagesEN.set("Edit map layers","Edit map layers");
        
        /* Import dialogue */
        messagesEN.set("Import","Import");
        messagesEN.set("Features","Features");
        messagesEN.set("Properties","Properties");
        messagesEN.set("Attributes","Attributes");
        messagesEN.set("Settings","Settings");
        messagesEN.set("File Content","File Content");
        messagesEN.set("Existing Data","Existing Data");
        messagesEN.set("Include Properties","Include Properties");
        messagesEN.set("Include Attributes","Include Attributes");
        messagesEN.set("Include Settings","Include Settings");
        messagesEN.set("Please specify file to import","Please specify file to import");
        messagesEN.set(" features successfully read from data source."," features successfully read from data source");
        messagesEN.set("Data has no valid format. No features were loaded.","Data has no valid format. No features were loaded.");
        messagesEN.set("WARNING: Unable to process properties of feature ","WARNING: Unable to process properties of feature ");
        messagesEN.set(" due to "," due to ");
        messagesEN.set("WARNING: Unable to process attributes of feature ","WARNING: Unable to process attributes of feature ");
        messagesEN.set("WARNING: Unable to load settings due to ","WARNING: Unable to load settings due to ");
        messagesEN.set("WARNING: Invalid property structure KML description tag: ","WARNING: Invalid property structure KML description tag: ");
        messagesEN.set("File must have at least ","File must have at least ");
        messagesEN.set(" columns in csv format"," columns in csv format");
        messagesEN.set("WARNING: colum ","WARNING: colum ");
        messagesEN.set(" should be named "," should be named ");
        messagesEN.set(". Instead found ",". Instead found ");
        messagesEN.set("File has no valid format. No data was loaded.","File has no valid format. No data was loaded.");
        messagesEN.set("WARNING: value of column 'feature' should be either 'Point', 'LineString' or 'Polygon'. Instead found '","WARNING: value of column 'feature' should be either 'Point', 'LineString' or 'Polygon'. Instead found '");
        messagesEN.set("'. Row will be ignored!","'. Row will be ignored!");
        messagesEN.set("WARNING: value of column 'fromYear' has to be a valid integer number. Instead found '","WARNING: value of column 'fromYear' has to be a valid integer number. Instead found '");
        messagesEN.set("WARNING: value of column 'toYear' has to be a valid integer number. Instead found '","WARNING: value of column 'toYear' has to be a valid integer number. Instead found '");
        messagesEN.set("'. Value will be ignored!","'. Value will be ignored!");
        messagesEN.set("Features loaded successfully!","Features loaded successfully!");
        messagesEN.set(" features successfully loaded into database."," features successfully loaded into database.");
        messagesEN.set("Error during upload of Features data into database.","Error during upload of Features data into database.");
        messagesEN.set("Features Properties loaded successfully!","Features Properties loaded successfully!");
        messagesEN.set("WARNING: Property not added as no feature found for featureId/featureType ","WARNING: Property not added as no feature found for featureId/featureType ");
        messagesEN.set(" feature properties successfully loaded into database."," feature properties successfully loaded into database.");
        messagesEN.set("Error during upload of Features Properties data into database.","Error during upload of Features Properties data into database.");
        messagesEN.set("Features Attributes loaded successfully!","Features Attributes loaded successfully!");
        messagesEN.set("WARNING: Attribute not added as no feature found for featureId/featureType ","WARNING: Attribute not added as no feature found for featureId/featureType ");
        messagesEN.set(" feature attributes successfully loaded into database."," feature attributes successfully loaded into database.");
        messagesEN.set("Error during upload of Features Attributes data into database.","Error during upload of Features Attributes data into database.");
        messagesEN.set("Settings loaded successfully!","Settings loaded successfully!");
        messagesEN.set(" settings successfully loaded into database."," settings successfully loaded into database.");
        messagesEN.set("Error during upload of settings data into database.","Error during upload of settings data into database.");
        messagesEN.set("Successfully loaded ","Successfully loaded ");
        messagesEN.set("Unable to load ","Unable to load ");
        messagesEN.set("Unable to save ","Unable to save ");
        messagesEN.set("features from GeoJSON file","features from GeoJSON file");
        messagesEN.set("feature attributess from csv file","feature attributess from csv file");
        messagesEN.set("feature properties from csv file","feature properties from csv file");
        messagesEN.set("settings from JSON file","settings from JSON file");
        messagesEN.set(" with warnings"," with warnings");
        messagesEN.set("Unable to init map","Unable to init map");
        messagesEN.set("Unable to update map","Unable to update map");
        messagesEN.set("Unable to focus on feature","Unable to focus on feature");

        /* Export dialogue */
        messagesEN.set("Export Data","Export Data");
        messagesEN.set("Export","Export");
        messagesEN.set("Please specify file name for export file","Please specify file name for export file");
        
        /* Settings dialogue */
        messagesEN.set("Feature Settings Overview","Feature Settings Overview");
        messagesEN.set("Standard","Standard");
        messagesEN.set("Attribute","Attribute");
        messagesEN.set("Feature","Feature");
        messagesEN.set("Label","Label");
        messagesEN.set("Color","Color");
        messagesEN.set("Width","Width");
        messagesEN.set("Border Color","Border Color");
        messagesEN.set("Border Width","Border Width");
        messagesEN.set("Radius","Radius");
        messagesEN.set("General Settings","General Settings");
        messagesEN.set("Show Feature on map","Show Feature on map");
        messagesEN.set("Show Feature Label on map","Show Feature Label on map");
        messagesEN.set("Shape & Filling Color","Shape & Filling Color");
        messagesEN.set("Shape Type","Shape Type");
        messagesEN.set("Filling Color","Filling Color");
        messagesEN.set("Border","Border");
        messagesEN.set("Placement","Placement");
        messagesEN.set("Special settings for Polygon & Star","Special settings for Polygon & Star");
        messagesEN.set("# points","# points");
        messagesEN.set("2nd Radius star","2nd Radius star");
        messagesEN.set("Line 1","Line 1");
        messagesEN.set("Line 2","Line 2"); 
        messagesEN.set("Shift horizontal","Shift horizontal"); 
        messagesEN.set("Shift vertical","Shift vertical"); 
        messagesEN.set("Rotate (rad*PI)","Rotate (rad*PI)"); 
        messagesEN.set("Dash Pattern","Dash Pattern");
        messagesEN.set("Dash Offset","Dash Offset");
        messagesEN.set("Line Cap","Line Cap");
        messagesEN.set("Please insert a valid float number into field ","Please insert a valid float number into field ");
        messagesEN.set("Please insert a valid integer number into field ","Please insert a valid integer number into field ");
        messagesEN.set("Circle","Kreis");
        messagesEN.set("Star","Stern");
        messagesEN.set("round","round");
        messagesEN.set("butt","butt");
        messagesEN.set("square","square");
        messagesEN.set("Edit Text Settings","Edit Text Settings");
        messagesEN.set("Offset (top/right/bottom/left)","Offset (top/right/bottom/left)");        
        messagesEN.set("has Changed","has Changed");        
        
        messagesEN.set("Font","Font");
        messagesEN.set("Text Color","Text Color");
        messagesEN.set("Font Style","Font Style");
        messagesEN.set("Font Weight","Font Weight");
        messagesEN.set("Font Size","Font Size");
        messagesEN.set("Font Family","Font Family");
        messagesEN.set("Font (css value)","Font (css value)");
        messagesEN.set("Alignment","Alignment");
        messagesEN.set("Text Align","Text Align");
        messagesEN.set("Text Placement","Text Placement");
        messagesEN.set("Settings for Background (only Point Placement)","Settings for Background (only Point Placement)");
        messagesEN.set("Settings for Line Placement)","Settings for Line Placement");
        messagesEN.set("Max Angle (rad*PI)","Max Angle (rad*PI)");
        messagesEN.set("Text Overflow","Text Overflow");
        messagesEN.set("Text Repeat","Text Repeat");
        messagesEN.set("normal","normal");        
        messagesEN.set("italic","italic");        
        messagesEN.set("bold","bold");        
        messagesEN.set("left","left");        
        messagesEN.set("right","right");        
        messagesEN.set("center","center");        
        messagesEN.set("end","end");        
        messagesEN.set("start","start");        
        messagesEN.set("point","Font");        
        messagesEN.set("line","Font");        

        /* Time dialogue */
        messagesEN.set("Edit Time Settings","Edit Time Settings");
        messagesEN.set("Year Settings","Year Settings");
        messagesEN.set("Year from","Year from");
        messagesEN.set("Year to","Year to");
        messagesEN.set("Display Settings","Display Settings");
        messagesEN.set("Show time bar","Show time bar");
        messagesEN.set("Simulations Settings","Simulations Settings");
        messagesEN.set("Simulation speed","Simulation speed");

        /* Chart dialogue */
        messagesEN.set("Chart view","Chart view");
        messagesEN.set("Diagram filter & Properties","Diagram filter & Properties");
        messagesEN.set("Diagram","Diagram");
        messagesEN.set("Data","Data");
        messagesEN.set("aggregation","Aggregation by ");
        messagesEN.set("sum","sum ");
        messagesEN.set("count","count");
        messagesEN.set("developing","Developing of curve ");
        messagesEN.set("point in time","point in time");
        messagesEN.set("time interval","time interval");
        messagesEN.set("Stack bars","Stack bars");
        messagesEN.set("Diagram as JPEG","Diagram as JPEG");
        messagesEN.set("Diagram as PNG","Diagram as PNG");
        messagesEN.set("Data as <html>","Data as <html>");
        messagesEN.set("Data as [BB]","Data as [BB]");
        messagesEN.set("Data as Tab","Data as Tab");
        messagesEN.set("Table data copied to clipboard","Table data copied to clipboard");

        

        
        
        messagesEN.set("Bar","Bar");
        messagesEN.set("Line","Line");
        messagesEN.set("Metric","Metric");
        messagesEN.set("Imperial","Imperial");
        messagesEN.set("Degrees","Degrees");
        messagesEN.set("Nautical","Nautical");
        messagesEN.set("US","US");
        messagesEN.set("Layer Settings","Layer Settings");
        messagesEN.set("Layer","Layer");
        messagesEN.set("Opacity","Opacity");
        messagesEN.set("Scale Settings","Scale Settings");
        messagesEN.set("Scale Type","Scale Type");
        messagesEN.set("Units","Units");
        messagesEN.set("Steps","Steps");
        messagesEN.set("Feature Info","Feature Info");        
        
        messagesEN.set("Image type","Image type");        
        messagesEN.set("File name","File name");        
        messagesEN.set("Use CORS","Use CORS");        
        messagesEN.set("Allow taint","Allow taint");        


        messagesEN.set("Available layers","Available layers");        
        messagesEN.set("Add ARCGIS based layer","Add ARCGIS based layer");        
        messagesEN.set("Name of Layer","Name of Layer");        
        messagesEN.set("Source URL","Source URL");        
        messagesEN.set("Key (if required)","Key (if required)");        
        messagesEN.set("Attributions","Attributions");        
        messagesEN.set("CrossOrigin","CrossOrigin");        
        messagesEN.set("in use","in use");        
        messagesEN.set("standard","standard");        

        this.messages.set('en',messagesEN);
        
        
        
        
        
        const messagesDE = new Map();
        messagesDE.set('','');
        messagesDE.set("Show","Anzeigen");
        messagesDE.set("Save","Speichern");
        messagesDE.set("Add","Hinzufügen");
        messagesDE.set("Cancel","Abbrechen");
        messagesDE.set("Delete","Löschen");
        messagesDE.set("Overwrite","Überschreiben");
        messagesDE.set("Search","Suche");
        messagesDE.set("Edit","Ändern");
        messagesDE.set("File Name","Dateiname");
        messagesDE.set("None","Keine");
        messagesDE.set("No results","Keine Treffer");
        messagesDE.set("Too many results","Zu viele Treffer");
        messagesDE.set("Search Results","Suchergebnisse");
        messagesDE.set("Sort ascending","Aufsteigend sortieren");
        messagesDE.set("Sort descending","Absteigend sortieren");
        messagesDE.set("Name","Name");
        messagesDE.set("Length","Länge");
        messagesDE.set("Date","Datum");
        messagesDE.set("today","heute");
        messagesDE.set("Year","Jahr");
        messagesDE.set("Type","Typ");
        messagesDE.set("Yes","Ja");
        messagesDE.set("No","Nein");
        
        messagesDE.set("Point","Punkt");
        messagesDE.set("LineString","Linie");
        messagesDE.set("Polygon","Polygon");
        messagesDE.set("Focus on map","Auf Karte");
        messagesDE.set("Feature type","Feature-Typ");
        messagesDE.set("Attribute name","Attributname");
        messagesDE.set("Attribute value","Attributwert");
        messagesDE.set("From year","Von Jahr");
        messagesDE.set("To year","Bis Jahr");
        
        messagesDE.set("Import data","Daten importieren");
        messagesDE.set("Export data","Daten exportiern");
        messagesDE.set("Change feature settings","Feature-Einstellungen ändern");
        messagesDE.set("Change time settings","Zeiteinstellungen ändern");
        messagesDE.set("Search feature","Feature suchen");
        messagesDE.set("Table view","Tabellenansicht");
        messagesDE.set("Chart view","Diagrammansicht");
        
        messagesDE.set("Edit map settings","Karteneinstellungen editieren");
        messagesDE.set("Export map to image file","Karte als Bilddatei exportieren");
        messagesDE.set("Edit map layers","Kartenlayer editieren");

        
        /* Import dialogue */
        messagesDE.set("Import","Importieren");
        messagesDE.set("Features","Features");
        messagesDE.set("Properties","Properties");
        messagesDE.set("Attributes","Attribute");
        messagesDE.set("Settings","Einstellungen");
        messagesDE.set("File Content","Dateiinhalt");
        messagesDE.set("Existing Data","Bestehende Daten");
        messagesDE.set("Include Properties","Inklusive Properties");
        messagesDE.set("Include Attributes","Inklusive Attribute");
        messagesDE.set("Include Settings","Inklusive Einstellungen");
        messagesDE.set("Please specify file to import","Bitte zu importierende Datei auswählen!");
        messagesDE.set(" features successfully read from data source."," Features erfolgreich aus Datenquelle gelesen");
        messagesDE.set("Data has no valid format. No features were loaded.","Die Daten haben kein gültiges Format, es wurden keine Features geladen.");
        messagesDE.set("WARNING: Unable to process properties of feature ","WARNUNG: Verarbeitung der Properties nicht möglich von Feature ");
        messagesDE.set(" due to "," wegen ");
        messagesDE.set("WARNING: Unable to process attributes of feature ","WARNUNG: Verarbeitung der Attribute nicht möglich von Feature ");
        messagesDE.set("WARNING: Unable to load settings due to ","WARNUNG: Einstellungen konnten nicht geladen werden wegen ");
        messagesDE.set("WARNING: Invalid property structure KML description tag: ","WARNUNG: Ungültige Property-Struktur in KML <description>: ");
        messagesDE.set("File must have at least ","Datei muss mindestens ");
        messagesDE.set(" columns in csv format"," Spalten im csv-Format haben!");
        messagesDE.set("WARNING: colum ","WARNUNG: Spalte ");
        messagesDE.set(" should be named "," sollte die folgende Bezeichnung haben: ");
        messagesDE.set(". Instead found ",". Stattdessen hat sie die Bezeichnung ");
        messagesDE.set("File has no valid format. No data was loaded.","Datei hat ein ungültiges Format, es wurden keine Daten geladen.");
        messagesDE.set("WARNING: value of column 'feature' should be either 'Point', 'LineString' or 'Polygon'. Instead found '","WARNUNG: Der Wert der Spalte 'feature' sollte entweder 'Point', 'LineString' or 'Polygon' sein. Stattdessen hat er den Wert '");
        messagesDE.set("'. Row will be ignored!","'. Zeile wird ignoriert!");
        messagesDE.set("WARNING: value of column 'fromYear' has to be a valid integer number. Instead found '","WARNUNG: Der Wert der Spalte 'fromYear' muss eine gültige, ganze Zahl sein. Stattdessen hat er den Wert '");
        messagesDE.set("WARNING: value of column 'toYear' has to be a valid integer number. Instead found '","WARNUNG: Der Wert der Spalte 'toYear' has to be a valid integer number. Stattdessen hat er den Wert '");
        messagesDE.set("'. Value will be ignored!","'. Wert wird ignoriert!");
        messagesDE.set("Features loaded successfully!","Features erfolgreich geladen!");
        messagesDE.set(" features successfully loaded into database."," Features erfolgreich in Datenbank geladen.");
        messagesDE.set("Error during upload of Features data into database.","Fehler beim Laden der Feature-Daten in die Datenbank.");
        messagesDE.set("Features Properties loaded successfully!","Feature-Properties erfolgreich geladen!");
        messagesDE.set("WARNING: Property not added as no feature found for featureId/featureType ","WARNUNG: Property nicht hinzugefügt, da zugeordnetes Feature nicht in Datenbank gefunden wurde mit Typ/Id ");
        messagesDE.set(" feature properties successfully loaded into database."," Feature-Properties erfolgreich in Datenbank geladen!");
        messagesDE.set("Error during upload of Features Properties data into database.","Fehler beim Laden der Feature-Properties-Daten in die Datenbank.");
        messagesDE.set("Features Attributes loaded successfully!","Feature-Attribute erfolgreich geladen!");
        messagesDE.set("WARNING: Attribute not added as no feature found for featureId/featureType ","WARNUNG: Attribut nicht hinzugefügt, da zugeordnetes Feature nicht in Datenbank gefunden wurde mit Typ/Id ");
        messagesDE.set(" feature attributes successfully loaded into database."," Feature-Attributes erfolgreich in Datenbank geladen!");
        messagesDE.set("Error during upload of Features Attributes data into database.","Fehler beim Laden der Feature-Attribute-Daten in die Datenbank.");
        messagesDE.set("Settings loaded successfully!","Einstellungen erfolgreich geladen!");
        messagesDE.set(" settings successfully loaded into database."," Einstellungen erfolgreich in Datenbank geladen!");
        messagesDE.set("Error during upload of settings data into database.","Fehler beim Laden der Einstellungen in die Datenbank.");
        messagesDE.set("Successfully loaded ","Erfolgreicher Ladevorgang von ");
        messagesDE.set("Unable to load ","Laden nicht möglich von ");
        messagesDE.set("Unable to save ","Speichern nicht möglich ");
        messagesDE.set("features from GeoJSON file","Features aus GeoJSON-Datei");
        messagesDE.set("feature attributess from csv file","Feature-Attributen aus csv-Datei");
        messagesDE.set("feature properties from csv file","Feature-Properties aus csv-Datei");
        messagesDE.set("settings from JSON file","Einstellungen aus JSON-Datei");
        messagesDE.set(" with warnings"," mit Warnungen");
        messagesDE.set("Unable to init map","Karte konnte nicht initialisiert werden");
        messagesDE.set("Unable to update map","Karte konnte nicht aktualisiert werden");
        messagesDE.set("Unable to focus on feature","Fokussieren auf Feature nicht möglich");


        /* Export dialogue */
        messagesDE.set("Export Data","Daten exportieren ");
        messagesDE.set("Export","Exportieren");
        messagesDE.set("Please specify file name for export file","Bitte Dateinamen für Export-Datei angeben");

        /* Settings dialogue */
        messagesDE.set("Feature Settings Overview","Übersicht Feature-Einstellungen");
        messagesDE.set("Standard","Standard");
        messagesDE.set("Attribute","Attribut");
        messagesDE.set("Feature","Feature");
        messagesDE.set("Label","Text?");
        messagesDE.set("Color","Farbe");
        messagesDE.set("Width","Breite");
        messagesDE.set("Border Color","Farbe Linie");
        messagesDE.set("Border Width","Breite Linie");
        messagesDE.set("Radius","Radius");
        messagesDE.set("General Settings","Allgemeine Einstellungen");
        messagesDE.set("Show Feature on map","Feature auf Karte anzeigen");
        messagesDE.set("Show Feature Label on map","Feature-Text auf Karte anzeigen");
        messagesDE.set("Shape & Filling Color","Form & Füllfarbe");
        messagesDE.set("Shape Type","Form");
        messagesDE.set("Filling Color","Füllfarbe");
        messagesDE.set("Border","Rahmen");
        messagesDE.set("Placement","Anordnung");
        messagesDE.set("Special settings for Polygon & Star","Spezielle Einstellungen für Polygon und Stern");
        messagesDE.set("# points","Anzahl Ecken");
        messagesDE.set("2nd Radius star","2. Radius bei Stern");
        messagesDE.set("Line 1","1. Linie");
        messagesDE.set("Line 2","2. Linie");
        messagesDE.set("Shift horizontal","Verschiebung horizontal"); 
        messagesDE.set("Shift vertical","Verschiebung vertikal"); 
        messagesDE.set("Rotate (rad*PI)","Rotation (rad*PI)"); 
        messagesDE.set("Dash Pattern","Linienmuster");
        messagesDE.set("Dash Offset","Verschiebung");
        messagesDE.set("Line Cap","Linienabschluss");
        messagesDE.set("Please insert a valid float number into field ","Bitte gültige Gleitkommazahl eingeben im Feld ");
        messagesDE.set("Please insert a valid integer number into field ","Bitte gültige Ganze Zahl eingeben im Feld ");
        messagesDE.set("Circle","Kreis");
        messagesDE.set("Star","Stern");
        messagesDE.set("round","rund");
        messagesDE.set("butt","stumpf");
        messagesDE.set("square","eckig");
        messagesDE.set("Edit Text Settings","Texteinstellungen ändern");
        messagesDE.set("has Changed","geändert");        
        
        messagesDE.set("Font","Schrift");
        messagesDE.set("Text Color","Schriftfarbe");
        messagesDE.set("Font Style","Stil");
        messagesDE.set("Font Weight","Dicke");
        messagesDE.set("Font Size","Größe");
        messagesDE.set("Font Family","Schriftart");
        messagesDE.set("Font (css value)","Schrift als css-Wert");
        messagesDE.set("Alignment","Textanordnung");
        messagesDE.set("Text Align","Textausrichtung");
        messagesDE.set("Text Placement","Textzuordnung");
        messagesDE.set("Settings for Background (only Point Placement)","Hintergrundeinstellungen (nur bei Punktplatzierung)");
        messagesDE.set("Settings for Line Placement)","Einstellungen bei Linienplatzierung");
        messagesDE.set("Max Angle (rad*PI)","Max. Winkel (rad*PI)");
        messagesDE.set("Text Overflow","Textüberlauf");
        messagesDE.set("Text Repeat","Text wiederholen");
        messagesDE.set("normal","normal");        
        messagesDE.set("italic","kursiv");        
        messagesDE.set("bold","fett");        
        messagesDE.set("left","links");        
        messagesDE.set("right","rechts");        
        messagesDE.set("center","zentriert");        
        messagesDE.set("end","Anfang");        
        messagesDE.set("start","Ende");        
        messagesDE.set("point","An Punkt");        
        messagesDE.set("line","Entlang Linie");        
        messagesDE.set("Offset (top/right/bottom/left)","Abstand (oben/rechts/unten/links)");        

        /* Time dialogue */
        messagesDE.set("Edit Time Settings","Zeiteinstellungen ändern");
        messagesDE.set("Year Settings","Kartenjahr/periode");
        messagesDE.set("Year from","Anfangsjahr");
        messagesDE.set("Year to","Endjahr");
        messagesDE.set("Display Settings","Anzeige");
        messagesDE.set("Show time bar","Zeitbalken anzeigen");
        messagesDE.set("Simulations Settings","Simulationseinstellungen");
        messagesDE.set("Simulation speed","Geschwindigkeit");

        /* Chart dialogue */
        messagesDE.set("Chart view","Diagrammansicht");
        messagesDE.set("Diagram filter & Properties","Diagrammfilter & Eigenschaften");
        messagesDE.set("Diagram","Diagramm");
        messagesDE.set("Data","Daten");
        messagesDE.set("aggregation","Aggregiert nach");
        messagesDE.set("sum","Summe ");
        messagesDE.set("count","Anzahl");
        messagesDE.set("developing","Kurvenverlauf");
        messagesDE.set("point in time","Zeitpunkt");
        messagesDE.set("time interval","Zeitintervall");
        messagesDE.set("Stack bars","Säulen stapeln");
        messagesDE.set("Diagram as JPEG","Diagramm als JPEG");
        messagesDE.set("Diagram as PNG","Diagramm als PNG");
        messagesDE.set("Data as <html>","Daten als <html>");
        messagesDE.set("Data as [BB]","Daten als [BB]");
        messagesDE.set("Data as Tab","Daten als Tab");
        messagesDE.set("Table data copied to clipboard","Tabellendaten in Ablage kopiert (Strg + V zum Einfügen)");

        
        
        
        messagesDE.set("Bar","Balken");
        messagesDE.set("Line","Linie");
        messagesDE.set("Metric","Metrisch");
        messagesDE.set("Imperial","Britisch");
        messagesDE.set("Degrees","Grad");
        messagesDE.set("Nautical","Nautisch");
        messagesDE.set("US","Amerikanisch");
        messagesDE.set("Layer Settings","Layer-Einstellungen");
        messagesDE.set("Layer","Layer");
        messagesDE.set("Opacity","Deckkraft");
        messagesDE.set("Scale Settings","Maßstab");
        messagesDE.set("Scale Type","Darstellung");
        messagesDE.set("Units","Einheiten");
        messagesDE.set("Steps","Anzahl Einheiten");
        messagesDE.set("Feature Info","Feature-Informationen");        

        messagesDE.set("Image type","Bildtyp");        
        messagesDE.set("File name","Dateiname");        
        messagesDE.set("Use CORS","CORS benutzen");        
        messagesDE.set("Allow taint","Taint erlauben");        

        messagesDE.set("Available layers","Verfügbare Layer");        
        messagesDE.set("Add ARCGIS based layer","Layer auf ARCGIS Basis hinzufügen");        
        messagesDE.set("Name of Layer","Layer-Name");        
        messagesDE.set("Source URL","Quellen-URL");        
        messagesDE.set("Key (if required)","Key (falls notwendig)");        
        messagesDE.set("Attributions","Attributions");        
        messagesDE.set("CrossOrigin","CrossOrigin");        
        messagesDE.set("in use","wird benutzt");        
        messagesDE.set("standard","Standard");      

        this.messages.set('de',messagesDE);
    };

    /**
     * 
     * @returns {String} two character language based on the browsers settings
     */
    getUserLang () {
        let lang = navigator.browserLanguage || navigator.language || navigator.userLanguage || 'en_GB';
        lang = lang.substr(0,2).toLowerCase();
        return lang;
    };

    /**
     * 
     * @param {String} key text fragment to be translated
     * @returns {String} the translated text fragment based on the browsers settings
     */
    getMsg(key) {
        return this.messages.get(this.lang)? this.messages.get(this.lang).get(key) : this.messages.get('len').get(key);
    }
}

/**
 * Factory class that provides the Translator implementation (currently only class IAMTranslator)
 * 
 * @type IAMTranslatorFactory
 */
class IAMTranslatorFactory {
    static instance;
    
    static getInstance () {
        if (!this.instance) {
            this.instance = new IAMTranslator();
        }
        return this.instance;
    }
    
    static getMsg(key) {
        return this.getInstance().getMsg(key);
    }
}
export {IAMTranslatorFactory}



/**
 * Automatically starts a file download by creating a temporary download link for a file with the given name and content. It automatically clicks on the link and removes the link afterwards. 
 * 
 * @param {String} content
 * @param {String} filename
 * @returns {undefined}
 */
const download = (content, filename) =>  {
	const a = document.createElement('a');
	a.download = filename;
	a.href = content;
	document.body.appendChild(a);
	a.click();
        document.body.removeChild(a);           
};
export {download}



/**
 * Switches the elements at position i and j in the specified array in place (e.g. no new instance of an array is created)
 * 
 * @param {Array} array
 * @param {Number} i
 * @param {Number} j
 * @returns {undefined}
 */
const switchValues = (array, i, j) => {
    if (i>=0 && j>=0 && i<array.length && j < array.length) {
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};
export {switchValues}

/**
 * Deletes the element at position i from the specified array in place (e.g. no new instance of an array is created). All elements behind the specified position will be shifted forward and the array will be shortened by one element
 * 
 * @param {Array} array
 * @param {Number} i
 * @returns {undefined}
 */
const deleteValue = (array, i) => {
    if (i>=0 && i<array.length ) {
        for (let counter=i;counter<array.length-1;counter++) {
            array[counter] = array[counter+1];
        }
        array.pop();
    }   
};
export {deleteValue}



/**
 * Template patterns to transform a table/list into a certain format (e.g. html, bb, or csv tab
 * @type Map
 */
const formats = new Map();
formats.set('html',
    {
        openTableTag: '<table>',
        closeTableTag: '</table>',
        openRowTag: '<tr>',
        closeRowTag: '</tr>',
        openHeaderTag: '<th>',
        closeHeaderTag: '</th>',
        openContentTag: '<td>',
        closeContentTag: '</td>',
        openFooterTag: '<td>',
        closeFooterTag: '</td>'
});
formats.set('bb',
    {
        openTableTag: '[table0]',
        closeTableTag: '[/table0]',
        openRowTag: '[tr]',
        closeRowTag: '[/tr]',
        openHeaderTag: '[td][b] ',
        closeHeaderTag: ' [/b][/td]',
        openContentTag: '[td]',
        closeContentTag: '[/td]',
        openFooterTag: '[td][b] ',
        closeFooterTag: ' [/b][/td]'
}); 
formats.set('tab',
    {
        openTableTag: '',
        closeTableTag: '',
        openRowTag: '',
        closeRowTag: '\n',
        openHeaderTag: '',
        closeHeaderTag: '\t',
        openContentTag: '',
        closeContentTag: '\t',
        openFooterTag: '',
        closeFooterTag: '\t'
}); 

/**
 * Transforms the specified table/list into the specified target format
 * 
 * @param {Array[Object]} list
 * @param {type} cols column keys. For each row, the values will be taken from the object in the list using these keys
 * @param {Array[String]} colsHeader optional column headers; if not specified, no column headers will be generated
 * @param {Array[String]} footer optional footer if not specified, no footer will be generated
 * @param {'html'|'bb'|'tab'} targetFormat
 * @returns {String}
 */
const transform2Table = (list, cols, colsHeader, footer, targetFormat) => {
    let ret = '';
    const formatString = formats.get(targetFormat);
    
    ret = ret + formatString.openTableTag;
    
    //table header
    if (colsHeader) {
        ret = ret + formatString.openRowTag;
        colsHeader.forEach( (colHead) => {
           ret = ret +  formatString.openHeaderTag + colHead + formatString.closeHeaderTag;
        });
        ret = ret + formatString.closeRowTag;
    }

    //table content
    if (list) {
        list.forEach( (row) => {
            ret = ret + formatString.openRowTag;
            cols.forEach((col) => {
                ret = ret +  formatString.openContentTag + row[col] + formatString.closeContentTag;   
            });
            ret = ret + formatString.closeRowTag;
        });
    }
    
    //table footer
    if (footer) {
        ret = ret + formatString.openRowTag;
        footer.forEach( (footerItem) => {
           ret = ret +  formatString.openFooterTag + footerItem + formatString.closeFooterTag;
        });
        ret = ret + formatString.closeRowTag;       
    }

    ret = ret + formatString.closeTableTag;
    
    return ret;
};
export {transform2Table}