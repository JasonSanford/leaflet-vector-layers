var deps = {
    Core: {
        src: ['gvector.js',
              'core/Util.js',
              'core/Class.js'],
        desc: 'The core of the library, including OOP, base layer properties, etc.'
    },
    
    Layer: {
        src: ['layer/Layer.js'],
        desc: 'The base class for all layers',
        heading: 'Layers Core'
    },
    
    AGS: {
        src: ['layer/AGS.js'],
        desc: 'The ArcGIS Server layer.',
        heading: 'ArcGIS Server',
        deps: ['Layer']
    },
    
    GeoIQ: {
        src: ['layer/GeoIQ.js'],
        desc: 'The GeoIQ layer.',
        heading: 'GeoIQ',
        deps: ['Layer']
    },
    
    CartoDB: {
        src: ['layer/CartoDB.js'],
        desc: 'The CartoDB layer.',
        heading: 'CartoDB',
        deps: ['Layer']
    }
};