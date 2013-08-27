var deps = {
    Core: {
        src: ['lvector.js'],
        desc: 'The core of the library'
    },

    Layer: {
        src: ['layer/Layer.js'],
        desc: 'The base class for all layers',
        heading: 'Layers Core'
    },

    GeoJSONLayer: {
        src: ['layer/GeoJSONLayer.js'],
        desc: 'The GeoJSON geometry parsing layer type',
        heading: 'Layers that extend this can parse GeoJSON geometry',
        deps: ['Layer']
    },

    EsriJSONLayer: {
        src: ['layer/EsriJSONLayer.js'],
        desc: 'The EsriJSON geometry parsing layer type',
        heading: 'Layers that extend this can parse EsriJSON geometry',
        deps: ['Layer']
    },

    AGS: {
        src: ['layer/AGS.js'],
        desc: 'The ArcGIS Server layer.',
        heading: 'ArcGIS Server',
        deps: ['EsriJSONLayer']
    },

    A2E: {
        src: ['layer/A2E.js'],
        desc: 'The Arc2Earth layer.',
        heading: 'Arc2Earth',
        deps: ['AGS']
    },

    GeoIQ: {
        src: ['layer/GeoIQ.js'],
        desc: 'The GeoIQ layer.',
        heading: 'GeoIQ',
        deps: ['GeoJSONLayer']
    },

    CartoDB: {
        src: ['layer/CartoDB.js'],
        desc: 'The CartoDB layer.',
        heading: 'CartoDB',
        deps: ['GeoJSONLayer']
    },

    PRWSF: {
        src: ['layer/PRWSF.js'],
        desc: 'The PostGIS RESTful Web Service Framework layer.',
        heading: 'PRWSF',
        deps: ['GeoJSONLayer']
    },

    GISCloud: {
        src: ['layer/GISCloud.js'],
        desc: 'The GIS Cloud Layer',
        heading: 'GIS Cloud',
        deps: ['GeoJSONLayer']
    },

    GitSpatial: {
        src: ['layer/GitSpatial.js'],
        desc: 'The GitSpatial Layer',
        heading: 'GitSpatial',
        deps: ['GeoJSONLayer']
    }
};