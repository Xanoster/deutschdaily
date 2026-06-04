// ══════════════════════════════════════════════
// VOCABULARY DECK
// ══════════════════════════════════════════════
const VOCAB_SOURCE_REFS = {
  'goethe-a1': {
    label: 'Goethe Deutsch Online A1',
    url: 'https://lernen.goethe.de/deutschonline/A1/PDF/EN/A1_deutschonline_course_vocabulary_1-18_alphabetical.pdf',
  },
  'goethe-a2': {
    label: 'Goethe-Zertifikat A2 Wortliste',
    url: 'https://www.goethe.de/pro/relaunch/prf/en/Goethe-Zertifikat_A2_Wortliste.pdf',
  },
  'goethe-online-a2': {
    label: 'Goethe Deutsch Online A2',
    url: 'https://lernen.goethe.de/deutschonline/A2/PDF/EN/Wortschatz_A2_alpabetisch_EN.pdf',
  },
  mwd: {
    label: 'Goethe Mein Weg nach Deutschland',
    url: 'https://www.goethe.de/prj/mwd/de/index.html',
  },
  leipzig: {
    label: 'Leipzig Wortschatz frequency sanity check',
    url: 'https://wortschatz.uni-leipzig.de/en',
  },
};

const VOCAB_SOURCE_ALIASES = {
  a: 'goethe-a1',
  b: 'goethe-a2',
  c: 'goethe-online-a2',
  m: 'mwd',
  l: 'leipzig',
};

const VOCAB_TOPICS = [
  { id: 'basics', name: 'Basics & People', german: 'Grundlagen & Personen', emoji: '👤', color: '#2563EB' },
  { id: 'home', name: 'Housing', german: 'Wohnen', emoji: '🏠', color: '#D97706' },
  { id: 'admin', name: 'Admin & Legal', german: 'Behörden & Recht', emoji: '🏛️', color: '#0D9488' },
  { id: 'health', name: 'Health', german: 'Gesundheit', emoji: '🏥', color: '#DB2777' },
  { id: 'food', name: 'Food & Shopping', german: 'Essen & Einkauf', emoji: '🛒', color: '#EA580C' },
  { id: 'transport', name: 'Transport', german: 'Verkehr', emoji: '🚆', color: '#2563EB' },
  { id: 'work', name: 'Work & Education', german: 'Arbeit & Bildung', emoji: '💼', color: '#7C3AED' },
  { id: 'money', name: 'Money & Contracts', german: 'Geld & Verträge', emoji: '🏦', color: '#0D9488' },
  { id: 'phone', name: 'Phone & Internet', german: 'Telefon & Internet', emoji: '📱', color: '#16A34A' },
  { id: 'social', name: 'Social Life', german: 'Soziales Leben', emoji: '💬', color: '#DB2777' },
  { id: 'emergency', name: 'Problems & Emergencies', german: 'Probleme & Notfälle', emoji: '🆘', color: '#DC2626' },
  { id: 'core', name: 'Core Verbs & Adjectives', german: 'Kernverben & Adjektive', emoji: '⚙️', color: '#475569' },
];

const VOCAB_POS = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  phr: 'phrase',
};

const VOCAB_POS_LABELS = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  phrase: 'Phrase',
};

const VOCAB_DATA = {
  basics: `
n|der|Name|name|Namen|A1|al
n|der|Vorname|first name|Vornamen|A1|al
n|der|Nachname|last name|Nachnamen|A1|al
n|die|Adresse|address|Adressen|A1|alm
n|die|Straße|street|Straßen|A1|alm
n|die|Hausnummer|house number|Hausnummern|A1|alm
n|die|Postleitzahl|postal code|Postleitzahlen|A1|alm
n|die|Stadt|city|Städte|A1|al
n|das|Land|country|Länder|A1|al
n|die|Sprache|language|Sprachen|A1|al
n|die|Frage|question|Fragen|A1|al
n|die|Antwort|answer|Antworten|A1|al
n|das|Wort|word|Wörter|A1|al
n|der|Satz|sentence|Sätze|A1|al
n|die|Nummer|number|Nummern|A1|al
n|die|Telefonnummer|phone number|Telefonnummern|A1|al
n|die|E-Mail|email|E-Mails|A1|al
n|das|Passwort|password|Passwörter|A2|bcl
n|der|Code|code|Codes|A2|bcl
n|der|Moment|moment|Momente|A1|al
n|die|Hilfe|help|Hilfen|A1|al
n|das|Problem|problem|Probleme|A1|al
n|das|Beispiel|example|Beispiele|A1|al
n|der|Termin|appointment|Termine|A1|alm
n|der|Tag|day|Tage|A1|al
n|die|Woche|week|Wochen|A1|al
n|der|Monat|month|Monate|A1|al
n|das|Jahr|year|Jahre|A1|al
n|die|Uhrzeit|time of day|Uhrzeiten|A1|al
n|das|Datum|date|Daten|A1|al
n|der|Morgen|morning|Morgen|A1|al
n|der|Vormittag|late morning|Vormittage|A1|al
n|der|Nachmittag|afternoon|Nachmittage|A1|al
n|der|Abend|evening|Abende|A1|al
n|die|Nacht|night|Nächte|A1|al
n|die|Person|person|Personen|A1|al
n|der|Mann|man|Männer|A1|al
n|die|Frau|woman|Frauen|A1|al
n|das|Kind|child|Kinder|A1|al
n|die|Familie|family|Familien|A1|al
n|der|Freund|friend|Freunde|A1|al
n|die|Freundin|friend|Freundinnen|A1|al
n|der|Nachbar|neighbor|Nachbarn|A2|bml
n|die|Nachbarin|neighbor|Nachbarinnen|A2|bml
n|die|Tasche|bag|Taschen|A1|al
n|der|Schlüssel|key|Schlüssel|A1|alm
n|das|Handy|mobile phone|Handys|A1|al
n|der|Ausweis|ID card|Ausweise|A2|bml
`,
  home: `
n|die|Wohnung|apartment|Wohnungen|A1|aml
n|das|Zimmer|room|Zimmer|A1|al
n|die|Küche|kitchen|Küchen|A1|al
n|das|Bad|bathroom|Bäder|A1|al
n|die|Toilette|toilet|Toiletten|A1|al
n|die|Dusche|shower|Duschen|A1|al
n|die|Tür|door|Türen|A1|al
n|das|Fenster|window|Fenster|A1|al
n|der|Boden|floor|Böden|A2|bcl
n|die|Wand|wall|Wände|A2|bcl
n|die|Decke|ceiling|Decken|A2|bcl
n|das|Bett|bed|Betten|A1|al
n|der|Tisch|table|Tische|A1|al
n|der|Stuhl|chair|Stühle|A1|al
n|der|Schrank|cupboard|Schränke|A1|al
n|die|Lampe|lamp|Lampen|A1|al
n|die|Heizung|heating|Heizungen|A2|bml
n|der|Herd|stove|Herde|A2|bcl
n|der|Kühlschrank|refrigerator|Kühlschränke|A1|al
n|die|Waschmaschine|washing machine|Waschmaschinen|A2|bcl
n|die|Spülmaschine|dishwasher|Spülmaschinen|A2|bcl
n|die|Steckdose|socket|Steckdosen|A2|bcl
n|das|Licht|light|Lichter|A1|al
n|der|Müll|trash|—|A2|bml
n|die|Mülltonne|trash bin|Mülltonnen|A2|bml
n|der|Briefkasten|mailbox|Briefkästen|A2|bml
n|die|Klingel|doorbell|Klingeln|A2|bml
n|der|Aufzug|elevator|Aufzüge|A2|bml
n|die|Treppe|stairs|Treppen|A1|al
n|der|Keller|basement|Keller|A2|bml
n|der|Balkon|balcony|Balkone|A1|al
n|der|Garten|garden|Gärten|A1|al
n|die|Miete|rent|Mieten|A2|bml
n|die|Kaution|deposit|Kautionen|A2|bml
n|der|Mietvertrag|rental contract|Mietverträge|A2|bml
n|die|Hausordnung|house rules|Hausordnungen|A2|bml
n|die|Abrechnung|statement|Abrechnungen|A2|bml
n|der|Vermieter|landlord|Vermieter|A2|bml
n|die|Vermieterin|landlady|Vermieterinnen|A2|bml
n|der|Hausmeister|caretaker|Hausmeister|A2|bml
n|die|Reparatur|repair|Reparaturen|A2|bml
n|der|Schaden|damage|Schäden|A2|bml
n|der|Schimmel|mold|—|A2|bml
n|der|Schlüsseldienst|locksmith service|Schlüsseldienste|A2|bml
n|die|Wohnungsgeberbestätigung|landlord confirmation for registration|Wohnungsgeberbestätigungen|A2|bml
`,
  admin: `
n|das|Amt|office|Ämter|A2|bml
n|die|Behörde|authority|Behörden|A2|bml
n|das|Bürgeramt|citizens office|Bürgerämter|A2|bml
n|das|Rathaus|town hall|Rathäuser|A2|bml
n|die|Ausländerbehörde|foreigners authority|Ausländerbehörden|A2|bml
n|das|Jobcenter|job center|Jobcenter|A2|bml
n|das|Finanzamt|tax office|Finanzämter|A2|bml
n|das|Formular|form|Formulare|A1|alm
n|der|Antrag|application|Anträge|A2|bml
n|die|Unterlage|supporting document|Unterlagen|A2|bml
n|das|Dokument|document|Dokumente|A1|alm
n|die|Kopie|copy|Kopien|A1|alm
n|die|Bestätigung|confirmation|Bestätigungen|A2|bml
n|die|Bescheinigung|certificate|Bescheinigungen|A2|bml
n|die|Meldebescheinigung|registration certificate|Meldebescheinigungen|A2|bml
n|die|Anmeldung|registration|Anmeldungen|A2|bml
n|die|Ummeldung|change of address registration|Ummeldungen|A2|bml
n|die|Abmeldung|deregistration|Abmeldungen|A2|bml
n|der|Reisepass|passport|Reisepässe|A2|bml
n|der|Aufenthaltstitel|residence permit card|Aufenthaltstitel|A2|bml
n|die|Aufenthaltserlaubnis|residence permit|Aufenthaltserlaubnisse|A2|bml
n|das|Visum|visa|Visa|A2|bml
n|die|Fiktionsbescheinigung|temporary residence certificate|Fiktionsbescheinigungen|A2|bml
n|die|Steuer-ID|tax ID|Steuer-IDs|A2|bml
n|die|Versicherungsnummer|insurance number|Versicherungsnummern|A2|bml
n|das|Aktenzeichen|file reference|Aktenzeichen|A2|bml
n|die|Vorgangsnummer|case number|Vorgangsnummern|A2|bml
n|die|Kundennummer|customer number|Kundennummern|A2|bcl
n|die|Frist|deadline|Fristen|A2|bml
n|die|Fristverlängerung|deadline extension|Fristverlängerungen|A2|bml
n|die|Gebühr|fee|Gebühren|A2|bml
n|die|Quittung|receipt|Quittungen|A2|bcl
n|der|Brief|letter|Briefe|A1|alm
n|das|Schreiben|official letter|Schreiben|A2|bml
n|der|Bescheid|official decision notice|Bescheide|A2|bml
n|die|Entscheidung|decision|Entscheidungen|A2|bml
n|der|Widerspruch|objection|Widersprüche|A2|bml
n|die|Unterschrift|signature|Unterschriften|A2|bml
n|das|Passfoto|passport photo|Passfotos|A2|bml
n|das|Geburtsdatum|date of birth|Geburtsdaten|A1|alm
n|der|Familienstand|marital status|—|A2|bml
n|die|Nationalität|nationality|Nationalitäten|A1|alm
n|die|Terminbestätigung|appointment confirmation|Terminbestätigungen|A2|bml
n|der|Sachbearbeiter|case worker|Sachbearbeiter|A2|bml
n|die|Sachbearbeiterin|case worker|Sachbearbeiterinnen|A2|bml
`,
  health: `
n|der|Arzt|doctor|Ärzte|A1|alm
n|die|Ärztin|doctor|Ärztinnen|A1|alm
n|der|Hausarzt|family doctor|Hausärzte|A2|bml
n|der|Facharzt|specialist doctor|Fachärzte|A2|bml
n|die|Praxis|doctor's office|Praxen|A2|bml
n|das|Krankenhaus|hospital|Krankenhäuser|A1|alm
n|die|Apotheke|pharmacy|Apotheken|A1|alm
n|die|Notdienstapotheke|emergency pharmacy|Notdienstapotheken|A2|bml
n|das|Rezept|prescription|Rezepte|A2|bml
n|das|Medikament|medicine|Medikamente|A2|bml
n|die|Tablette|tablet|Tabletten|A2|bml
n|der|Tropfen|drop|Tropfen|A2|bml
n|die|Salbe|ointment|Salben|A2|bml
n|das|Fieber|fever|—|A1|alm
n|der|Husten|cough|—|A1|alm
n|der|Schnupfen|runny nose|—|A1|alm
n|der|Schmerz|pain|Schmerzen|A1|alm
n|der|Kopfschmerz|headache|Kopfschmerzen|A1|alm
n|der|Bauchschmerz|stomach pain|Bauchschmerzen|A2|bml
n|der|Rücken|back|Rücken|A1|alm
n|der|Bauch|belly|Bäuche|A1|alm
n|der|Kopf|head|Köpfe|A1|alm
n|der|Hals|throat|Hälse|A1|alm
n|die|Hand|hand|Hände|A1|alm
n|das|Bein|leg|Beine|A1|alm
n|der|Fuß|foot|Füße|A1|alm
n|das|Auge|eye|Augen|A1|alm
n|das|Ohr|ear|Ohren|A1|alm
n|der|Zahn|tooth|Zähne|A1|alm
n|das|Blut|blood|—|A2|bml
n|die|Wunde|wound|Wunden|A2|bml
n|die|Allergie|allergy|Allergien|A2|bml
n|die|Nebenwirkung|side effect|Nebenwirkungen|A2|bml
n|die|Untersuchung|examination|Untersuchungen|A2|bml
n|die|Überweisung|referral|Überweisungen|A2|bml
n|die|Krankenversicherung|health insurance|Krankenversicherungen|A2|bml
n|die|Versicherungskarte|insurance card|Versicherungskarten|A2|bml
n|die|Impfung|vaccination|Impfungen|A2|bml
n|die|Krankheit|illness|Krankheiten|A1|alm
n|die|Erkältung|cold|Erkältungen|A1|alm
n|der|Durchfall|diarrhea|—|A2|bml
n|die|Übelkeit|nausea|—|A2|bml
n|der|Schwindel|dizziness|—|A2|bml
n|der|Rettungswagen|ambulance|Rettungswagen|A2|bml
n|die|Krankschreibung|sick note|Krankschreibungen|A2|bml
`,
  food: `
n|der|Supermarkt|supermarket|Supermärkte|A1|alm
n|die|Bäckerei|bakery|Bäckereien|A1|alm
n|die|Metzgerei|butcher shop|Metzgereien|A2|bcl
n|der|Markt|market|Märkte|A1|alm
n|der|Laden|shop|Läden|A1|alm
n|das|Geschäft|store|Geschäfte|A1|alm
n|die|Kasse|checkout|Kassen|A1|alm
n|der|Einkaufswagen|shopping cart|Einkaufswagen|A2|bcl
n|der|Korb|basket|Körbe|A1|al
n|der|Bon|receipt|Bons|A2|bcl
n|das|Angebot|offer|Angebote|A2|bcl
n|der|Rabatt|discount|Rabatte|A2|bcl
n|das|Lebensmittel|food item|Lebensmittel|A2|bcl
n|das|Brot|bread|Brote|A1|al
n|das|Brötchen|bread roll|Brötchen|A1|al
n|die|Milch|milk|—|A1|al
n|der|Käse|cheese|Käse|A1|al
n|das|Ei|egg|Eier|A1|al
n|das|Fleisch|meat|—|A1|al
n|der|Fisch|fish|Fische|A1|al
n|das|Gemüse|vegetables|—|A1|al
n|das|Obst|fruit|—|A1|al
n|die|Kartoffel|potato|Kartoffeln|A1|al
n|der|Reis|rice|—|A1|al
n|die|Nudel|noodle|Nudeln|A1|al
n|das|Mineralwasser|mineral water|—|A1|al
n|der|Kaffee|coffee|Kaffees|A1|al
n|der|Tee|tea|Tees|A1|al
n|der|Saft|juice|Säfte|A1|al
n|der|Zucker|sugar|—|A1|al
n|das|Salz|salt|—|A1|al
n|das|Öl|oil|Öle|A1|al
n|die|Butter|butter|—|A1|al
n|der|Joghurt|yogurt|Joghurts|A1|al
n|der|Apfel|apple|Äpfel|A1|al
n|die|Banane|banana|Bananen|A1|al
n|die|Tomate|tomato|Tomaten|A1|al
n|die|Zwiebel|onion|Zwiebeln|A1|al
n|die|Gurke|cucumber|Gurken|A1|al
n|die|Tüte|bag|Tüten|A1|al
n|das|Pfand|deposit|—|A2|bcl
n|die|Flasche|bottle|Flaschen|A1|al
n|die|Dose|can|Dosen|A1|al
n|der|Kassenbon|receipt|Kassenbons|A2|bcl
n|der|Einkaufszettel|shopping list|Einkaufszettel|A2|bcl
`,
  transport: `
n|der|Bahnhof|train station|Bahnhöfe|A1|alm
n|die|Haltestelle|stop|Haltestellen|A1|alm
n|das|Gleis|platform track|Gleise|A1|alm
n|der|Bahnsteig|platform|Bahnsteige|A2|bcl
n|der|Zug|train|Züge|A1|al
n|die|S-Bahn|suburban train|S-Bahnen|A1|aml
n|die|U-Bahn|subway|U-Bahnen|A1|aml
n|der|Bus|bus|Busse|A1|al
n|die|Straßenbahn|tram|Straßenbahnen|A1|aml
n|das|Taxi|taxi|Taxis|A1|al
n|das|Fahrrad|bicycle|Fahrräder|A1|al
n|das|Auto|car|Autos|A1|al
n|die|Fahrkarte|ticket|Fahrkarten|A1|alm
n|das|Ticket|ticket|Tickets|A1|al
n|das|Deutschlandticket|Germany ticket|Deutschlandtickets|A2|mcl
n|die|Monatskarte|monthly pass|Monatskarten|A2|bcl
n|die|Einzelfahrt|single trip|Einzelfahrten|A2|bcl
n|die|Verbindung|connection|Verbindungen|A2|bcl
n|die|Linie|line|Linien|A1|al
n|die|Richtung|direction|Richtungen|A1|al
n|die|Verspätung|delay|Verspätungen|A2|bcl
n|der|Ausfall|cancellation|Ausfälle|A2|bcl
n|der|Ersatzbus|replacement bus|Ersatzbusse|A2|bcl
n|der|Umstieg|transfer|Umstiege|A2|bcl
n|der|Anschluss|connection|Anschlüsse|A2|bcl
n|die|Abfahrt|departure|Abfahrten|A1|al
n|die|Ankunft|arrival|Ankünfte|A1|al
n|der|Fahrplan|timetable|Fahrpläne|A1|alm
n|die|Kontrolle|inspection|Kontrollen|A2|bcl
n|der|Kontrolleur|ticket inspector|Kontrolleure|A2|bcl
n|die|Kontrolleurin|ticket inspector|Kontrolleurinnen|A2|bcl
n|der|Fahrer|driver|Fahrer|A1|al
n|die|Fahrerin|driver|Fahrerinnen|A1|al
n|der|Sitzplatz|seat|Sitzplätze|A1|al
n|der|Wagen|carriage|Wagen|A2|bcl
n|der|Koffer|suitcase|Koffer|A1|al
n|der|Rucksack|backpack|Rucksäcke|A1|al
n|die|Zone|zone|Zonen|A2|bcl
n|der|Entwerter|ticket validator|Entwerter|A2|bcl
n|der|Fahrstuhl|elevator|Fahrstühle|A2|bcl
`,
  work: `
n|die|Arbeit|work|Arbeiten|A1|al
n|der|Arbeitsplatz|workplace|Arbeitsplätze|A2|bcl
n|der|Arbeitgeber|employer|Arbeitgeber|A2|bcl
n|der|Arbeitnehmer|employee|Arbeitnehmer|A2|bcl
n|der|Chef|boss|Chefs|A1|al
n|die|Chefin|boss|Chefinnen|A1|al
n|der|Kollege|colleague|Kollegen|A1|al
n|die|Kollegin|colleague|Kolleginnen|A1|al
n|das|Team|team|Teams|A1|al
n|das|Büro|office|Büros|A1|al
n|die|Schicht|shift|Schichten|A2|bcl
n|der|Arbeitsvertrag|employment contract|Arbeitsverträge|A2|bcl
n|das|Gehalt|salary|Gehälter|A2|bcl
n|der|Lohn|wage|Löhne|A2|bcl
n|die|Gehaltsabrechnung|payslip|Gehaltsabrechnungen|A2|bcl
n|die|Steuerklasse|tax class|Steuerklassen|A2|bcl
n|die|Krankmeldung|sick notification|Krankmeldungen|A2|bcl
n|der|Urlaub|vacation|Urlaube|A1|al
n|der|Feiertag|public holiday|Feiertage|A1|alm
n|die|Pause|break|Pausen|A1|al
n|die|Besprechung|meeting|Besprechungen|A2|bcl
n|das|Meeting|meeting|Meetings|A2|bcl
n|die|Aufgabe|task|Aufgaben|A1|al
n|das|Projekt|project|Projekte|A1|al
n|die|Priorität|priority|Prioritäten|A2|bcl
n|die|Nachricht|message|Nachrichten|A1|al
n|die|Datei|file|Dateien|A2|bcl
n|der|Ordner|folder|Ordner|A2|bcl
n|der|Drucker|printer|Drucker|A2|bcl
n|der|Laptop|laptop|Laptops|A2|bcl
n|die|Bewerbung|application|Bewerbungen|A2|bcl
n|der|Lebenslauf|CV|Lebensläufe|A2|bcl
n|das|Zeugnis|certificate|Zeugnisse|A2|bcl
n|die|Ausbildung|vocational training|Ausbildungen|A2|bcl
n|die|Schule|school|Schulen|A1|al
n|der|Kurs|course|Kurse|A1|al
n|der|Unterricht|lesson|—|A1|al
n|die|Prüfung|exam|Prüfungen|A2|bcl
n|das|Praktikum|internship|Praktika|A2|bcl
n|das|Homeoffice|home office|Homeoffices|A2|bcl
`,
  money: `
n|das|Geld|money|—|A1|al
n|das|Bargeld|cash|—|A2|bcl
n|das|Konto|account|Konten|A2|bcl
n|die|Bank|bank|Banken|A1|al
n|die|Bankkarte|bank card|Bankkarten|A2|bcl
n|die|Kreditkarte|credit card|Kreditkarten|A2|bcl
n|die|Girokarte|debit card|Girokarten|A2|bcl
n|die|IBAN|IBAN|IBANs|A2|bcl
n|die|Überweisung|bank transfer|Überweisungen|A2|bcl
n|der|Dauerauftrag|standing order|Daueraufträge|A2|bcl
n|die|Lastschrift|direct debit|Lastschriften|A2|bcl
n|das|Lastschriftmandat|direct debit mandate|Lastschriftmandate|A2|bcl
n|die|Zahlung|payment|Zahlungen|A2|bcl
n|die|Rechnung|bill|Rechnungen|A1|al
n|die|Mahnung|payment reminder|Mahnungen|A2|bcl
n|der|Betrag|amount|Beträge|A2|bcl
n|der|Cent|cent|Cent|A1|al
n|der|Euro|euro|Euro|A1|al
n|das|Einkommen|income|Einkommen|A2|bcl
n|die|Ausgabe|expense|Ausgaben|A2|bcl
n|die|Versicherung|insurance|Versicherungen|A2|bcl
n|die|Haftpflichtversicherung|liability insurance|Haftpflichtversicherungen|A2|mcl
n|die|Hausratversicherung|home contents insurance|Hausratversicherungen|A2|mcl
n|die|Kündigung|cancellation notice|Kündigungen|A2|bcl
n|die|Erstattung|refund|Erstattungen|A2|bcl
n|die|Rückerstattung|refund|Rückerstattungen|A2|bcl
n|die|Steuer|tax|Steuern|A2|bcl
n|die|Steuererklärung|tax return|Steuererklärungen|A2|bcl
n|die|PIN|PIN|PINs|A2|bcl
n|die|TAN|transaction code|TANs|A2|bcl
n|der|Geldautomat|ATM|Geldautomaten|A2|bcl
n|der|Automat|machine|Automaten|A1|al
n|der|Kontoauszug|account statement|Kontoauszüge|A2|bcl
n|der|Zins|interest|Zinsen|A2|bcl
n|der|Kredit|loan|Kredite|A2|bcl
n|der|Lastschrifteinzug|direct debit collection|Lastschrifteinzüge|A2|bcl
n|die|Zahlungsfrist|payment deadline|Zahlungsfristen|A2|bcl
n|die|Mahngebühr|late payment fee|Mahngebühren|A2|bcl
n|der|Versicherungsbeitrag|insurance premium|Versicherungsbeiträge|A2|bcl
n|die|Schadennummer|claim number|Schadennummern|A2|bcl
`,
  phone: `
n|das|Telefon|telephone|Telefone|A1|al
n|das|Smartphone|smartphone|Smartphones|A1|al
n|die|App|app|Apps|A2|bcl
n|die|Webseite|website|Webseiten|A2|bcl
n|das|WLAN|Wi-Fi|—|A2|bcl
n|der|Router|router|Router|A2|bcl
n|der|Anbieter|provider|Anbieter|A2|bcl
n|der|Tarif|plan|Tarife|A2|bcl
n|der|Kundendienst|customer service|Kundendienste|A2|bcl
n|die|Hotline|hotline|Hotlines|A2|bcl
n|der|Kundenservice|customer service|—|A2|bcl
n|die|SMS|text message|SMS|A1|al
n|der|Anruf|call|Anrufe|A2|bcl
n|der|Rückruf|callback|Rückrufe|A2|bcl
n|die|Mailbox|voicemail|Mailboxen|A2|bcl
n|der|Benutzername|username|Benutzernamen|A2|bcl
n|der|Zugang|access|Zugänge|A2|bcl
n|der|Link|link|Links|A2|bcl
n|die|Fehlermeldung|error message|Fehlermeldungen|A2|bcl
n|das|Gerät|device|Geräte|A2|bcl
n|der|Bildschirm|screen|Bildschirme|A2|bcl
n|das|Ladegerät|charger|Ladegeräte|A2|bcl
n|der|Akku|battery|Akkus|A2|bcl
n|die|SIM-Karte|SIM card|SIM-Karten|A2|bcl
n|das|Netz|network|Netze|A2|bcl
n|der|Empfang|reception|—|A2|bcl
n|das|Datenvolumen|data allowance|Datenvolumen|A2|bcl
n|der|Browser|browser|Browser|A2|bcl
n|der|Anhang|attachment|Anhänge|A2|bcl
n|das|Postfach|mailbox|Postfächer|A2|bcl
n|das|WLAN-Passwort|Wi-Fi password|WLAN-Passwörter|A2|bcl
n|der|Vertragspartner|contract partner|Vertragspartner|A2|bcl
n|die|Aktivierung|activation|Aktivierungen|A2|bcl
n|die|Störung|service disruption|Störungen|A2|bcl
n|das|Kundenkonto|customer account|Kundenkonten|A2|bcl
`,
  social: `
n|die|Mutter|mother|Mütter|A1|al
n|der|Vater|father|Väter|A1|al
n|der|Bruder|brother|Brüder|A1|al
n|die|Schwester|sister|Schwestern|A1|al
n|der|Sohn|son|Söhne|A1|al
n|die|Tochter|daughter|Töchter|A1|al
n|der|Ehepartner|spouse|Ehepartner|A2|bcl
n|die|Ehefrau|wife|Ehefrauen|A1|al
n|der|Ehemann|husband|Ehemänner|A1|al
n|der|Partner|partner|Partner|A1|al
n|die|Partnerin|partner|Partnerinnen|A1|al
n|die|Einladung|invitation|Einladungen|A2|bcl
n|der|Besuch|visit|Besuche|A1|al
n|der|Geburtstag|birthday|Geburtstage|A1|al
n|das|Geschenk|gift|Geschenke|A1|al
n|die|Feier|celebration|Feiern|A2|bcl
n|der|Verein|club|Vereine|A2|bcl
n|die|Gruppe|group|Gruppen|A1|al
n|das|Hobby|hobby|Hobbys|A1|al
n|der|Sport|sport|Sportarten|A1|al
n|der|Spaziergang|walk|Spaziergänge|A1|al
n|das|Kino|cinema|Kinos|A1|al
n|das|Restaurant|restaurant|Restaurants|A1|al
n|das|Café|cafe|Cafés|A1|al
n|der|Park|park|Parks|A1|al
n|der|Spielplatz|playground|Spielplätze|A2|bcl
n|das|Treffen|meeting|Treffen|A2|bcl
n|der|Plan|plan|Pläne|A1|al
n|das|Wochenende|weekend|Wochenenden|A1|al
n|die|Entschuldigung|apology|Entschuldigungen|A1|al
n|die|Bitte|request|Bitten|A1|al
n|der|Dank|thanks|—|A1|al
n|die|Meinung|opinion|Meinungen|A2|bcl
n|das|Interesse|interest|Interessen|A2|bcl
n|die|Freizeit|free time|—|A1|al
n|die|Beziehung|relationship|Beziehungen|A2|bcl
n|das|Gespräch|conversation|Gespräche|A2|bcl
n|der|Smalltalk|small talk|—|A2|bcl
n|die|Verabredung|arrangement to meet|Verabredungen|A2|bcl
n|die|Zusage|acceptance|Zusagen|A2|bcl
`,
  emergency: `
n|die|Polizei|police|—|A1|aml
n|die|Feuerwehr|fire brigade|Feuerwehren|A2|bml
n|der|Rettungsdienst|emergency medical service|Rettungsdienste|A2|bml
n|der|Krankenwagen|ambulance|Krankenwagen|A2|bml
n|der|Unfall|accident|Unfälle|A1|aml
n|die|Verletzung|injury|Verletzungen|A2|bml
n|die|Gefahr|danger|Gefahren|A2|bml
n|das|Feuer|fire|Feuer|A1|aml
n|der|Rauch|smoke|—|A2|bml
n|der|Diebstahl|theft|Diebstähle|A2|bml
n|der|Geldbeutel|wallet|Geldbeutel|A2|bml
n|der|Standort|location|Standorte|A2|bml
n|der|Notruf|emergency call|Notrufe|A2|bml
n|der|Täter|perpetrator|Täter|A2|bml
n|der|Zeuge|witness|Zeugen|A2|bml
n|die|Zeugin|witness|Zeuginnen|A2|bml
n|die|Panne|breakdown|Pannen|A2|bml
n|die|Warnung|warning|Warnungen|A2|bml
n|der|Ausgang|exit|Ausgänge|A1|al
n|der|Eingang|entrance|Eingänge|A1|al
n|die|Sperrung|closure|Sperrungen|A2|bml
n|der|Fluchtweg|escape route|Fluchtwege|A2|bml
n|die|Sicherheit|safety|—|A2|bml
n|die|Angst|fear|Ängste|A1|al
n|der|Streit|argument|Streite|A2|bcl
n|der|Lärm|noise|—|A2|bml
n|der|Einbruch|burglary|Einbrüche|A2|bml
n|der|Verlust|loss|Verluste|A2|bml
n|das|Fundbüro|lost and found office|Fundbüros|A2|bml
n|die|Anzeige|police report|Anzeigen|A2|bml
n|die|Wache|station|Wachen|A2|bml
n|die|Sirene|siren|Sirenen|A2|bml
n|der|Alarm|alarm|Alarme|A2|bml
n|der|Notausgang|emergency exit|Notausgänge|A2|bml
n|der|Verbandskasten|first-aid kit|Verbandskästen|A2|bml
`,
  core: `
v||sein|to be||A1|al|Ich bin hier.|I am here.
v||haben|to have||A1|al|Ich habe Zeit.|I have time.
v||machen|to do / make||A1|al
v||gehen|to go||A1|al
v||kommen|to come||A1|al
v||wohnen|to live||A1|al
v||arbeiten|to work||A1|al
v||lernen|to learn||A1|al
v||sprechen|to speak||A1|al
v||verstehen|to understand||A1|al
v||fragen|to ask||A1|al
v||antworten|to answer||A1|al
v||suchen|to look for||A1|al
v||finden|to find||A1|al
v||brauchen|to need||A1|al
v||möchten|would like||A1|al|Ich möchte einen Termin.|I would like an appointment.
v||können|can / to be able to||A1|al|Ich kann kommen.|I can come.
v||müssen|must / to have to||A1|al|Ich muss gehen.|I have to go.
v||dürfen|may / to be allowed to||A1|al|Darf ich kurz fragen?|May I ask briefly?
v||sollen|should / to be supposed to||A1|al|Soll ich warten?|Should I wait?
v||kaufen|to buy||A1|al
v||bezahlen|to pay||A1|al
v||buchen|to book||A2|bcl
v||anrufen|to call||A1|al
v||schicken|to send||A1|al
v||bekommen|to get||A1|al
v||bringen|to bring||A1|al
v||abholen|to pick up||A2|bcl
v||anmelden|to register||A2|bml
v||ausfüllen|to fill out||A2|bml
v||unterschreiben|to sign||A2|bml
v||warten|to wait||A1|al
v||prüfen|to check||A2|bcl
v||ändern|to change||A2|bcl
v||öffnen|to open||A1|al
v||schließen|to close||A1|al
adj||kaputt|broken||A1|al
adj||wichtig|important||A1|al
adj||dringend|urgent||A2|bml
adj||möglich|possible||A2|bcl
adj||richtig|correct||A1|al
adj||falsch|wrong||A1|al
`,
};

const VOCAB_ARTICLE_GENDER = { der: 'm', die: 'f', das: 'n' };

function vocabCapitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function vocabRefsFromCode(code) {
  return [...new Set(String(code || '')
    .split('')
    .map(key => VOCAB_SOURCE_ALIASES[key])
    .filter(Boolean))];
}

function vocabDefaultExample({ pos, article, de, en }) {
  if (pos === 'noun') {
    return {
      de: `${vocabCapitalize(article)} ${de} ist wichtig.`,
      en: `The ${en} is important.`,
    };
  }
  if (pos === 'verb') {
    return {
      de: `Ich muss ${de}.`,
      en: `I have to ${String(en).replace(/^to\s+/i, '')}.`,
    };
  }
  if (pos === 'adjective') {
    return {
      de: `Das ist ${de}.`,
      en: `That is ${en}.`,
    };
  }
  if (pos === 'adverb') {
    return {
      de: `Ich mache das ${de}.`,
      en: `I do that ${en}.`,
    };
  }
  return {
    de,
    en,
  };
}

function parseVocabCards() {
  const cards = [];
  Object.entries(VOCAB_DATA).forEach(([topic, text]) => {
    String(text).trim().split('\n').map(line => line.trim()).filter(Boolean).forEach(line => {
      const [posCode, article, de, en, plural, level, refs, exampleDe, exampleEn] = line.split('|').map(part => part.trim());
      const pos = VOCAB_POS[posCode];
      const base = {
        pos,
        article,
        de,
        en,
      };
      const priority = cards.length + 1;
      const example = exampleDe && exampleEn
        ? { de: exampleDe, en: exampleEn }
        : vocabDefaultExample(base);
      cards.push({
        id: `vb${String(priority).padStart(3, '0')}`,
        de,
        en,
        pos,
        article: article || '',
        gender: pos === 'noun' ? VOCAB_ARTICLE_GENDER[article] || '' : '',
        plural: plural || '',
        topic,
        level,
        priority,
        example,
        sourceRefs: vocabRefsFromCode(refs),
      });
    });
  });
  return cards;
}

const VOCAB_CARDS = parseVocabCards();
const VOCAB_BY_ID = Object.fromEntries(VOCAB_CARDS.map(card => [card.id, card]));
