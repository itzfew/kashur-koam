// Define structured templates (infobox-style) for categories/types
const ARTICLE_TEMPLATES = {
  "Village": [
    { key: "district", label: "District" },
    { key: "population", label: "Population" },
    { key: "coordinates", label: "Coordinates (lat,lng)" },
    { key: "pincode", label: "PIN Code" }
  ],
  "District": [
    { key: "state", label: "State/UT" },
    { key: "headquarters", label: "Headquarters" },
    { key: "population", label: "Population" }
  ],
  "Person": [
    { key: "born", label: "Born (YYYY-MM-DD)" },
    { key: "occupation", label: "Occupation" },
    { key: "knownFor", label: "Known for" }
  ],
  "College": [
    { key: "established", label: "Established (YYYY)" },
    { key: "affiliation", label: "Affiliation/University" },
    { key: "location", label: "Location" }
  ],
  "School": [
    { key: "established", label: "Established (YYYY)" },
    { key: "board", label: "Board (e.g., JKBOSE, CBSE)" },
    { key: "location", label: "Location" }
  ],
  "Mosque": [
    { key: "location", label: "Location" },
    { key: "established", label: "Established (YYYY)" }
  ]
};

// Default categories list for homepage chips
const DEFAULT_CATEGORIES = Object.keys(ARTICLE_TEMPLATES);
