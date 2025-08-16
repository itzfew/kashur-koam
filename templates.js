

// templates.js
const TEMPLATES = {
    'Villages': {
        infoboxFields: ['name', 'district', 'population', 'elevation', 'languages'],
        sections: ['History', 'Geography', 'Culture', 'Economy', 'References']
    },
    'Districts': {
        infoboxFields: ['name', 'capital', 'area', 'population', 'established'],
        sections: ['Overview', 'Economy', 'Culture', 'Administration', 'References']
    },
    'Famous People': {
        infoboxFields: ['name', 'birth_date', 'occupation', 'nationality', 'known_for'],
        sections: ['Biography', 'Achievements', 'Legacy', 'References']
    },
    'Colleges': {
        infoboxFields: ['name', 'established', 'location', 'affiliation', 'principal'],
        sections: ['Courses', 'Facilities', 'History', 'Campus', 'References']
    },
    'Schools': {
        infoboxFields: ['name', 'established', 'location', 'type', 'principal'],
        sections: ['Curriculum', 'Extracurricular', 'History', 'Facilities', 'References']
    },
    'Mosques': {
        infoboxFields: ['name', 'built', 'location', 'architect', 'capacity'],
        sections: ['Architecture', 'History', 'Significance', 'Community', 'References']
    }
};
