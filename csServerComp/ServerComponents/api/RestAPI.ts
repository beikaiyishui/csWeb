import ApiManager = require('./ApiManager');
import express = require('express');
import cors = require('cors');
import Project = ApiManager.Project;
import Group = ApiManager.Group;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Logs = ApiManager.Log;
import ResourceFile = ApiManager.ResourceFile;
import BaseConnector = require('./BaseConnector');
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import Winston = require('winston');
import request = require('request');
import fs = require('fs');

export class RestAPI extends BaseConnector.BaseConnector {
    public manager: ApiManager.ApiManager;
    public resourceUrl;
    public layersUrl;
    public keysUrl;
    public filesUrl;
    public searchUrl;
    public projectsUrl;
    public proxyUrl;
    public tilesUrl;

    constructor(public server: express.Express, public baseUrl: string = '/api') {
        super();
        this.isInterface = true;
        this.resourceUrl = baseUrl + '/resources/';
        this.layersUrl = baseUrl + '/layers/';
        this.searchUrl = baseUrl + '/search/';
        this.filesUrl = baseUrl + '/files/';
        this.keysUrl = baseUrl + '/keys/';
        this.projectsUrl = baseUrl + '/projects/';
        this.proxyUrl = baseUrl + '/proxy';
        this.tilesUrl = baseUrl + '/tiles/';
    }

    public init(layerManager: ApiManager.ApiManager, options: any, callback: Function) {
        this.manager = layerManager;
        console.log('Init Rest API on port ' + this.server.get('port') + '. Base path is ' + this.baseUrl);

        //enables cors, used for external swagger requests
        this.server.use(cors());

        // get all resource types
        this.server.get(this.resourceUrl, (req: express.Request, res: express.Response) => {
            res.send(JSON.stringify(this.cloneWithoutUnderscore(this.manager.resources)));
        });

        /** add a new resource type file, returns an error if it already exists */
        this.server.post(this.resourceUrl, (req: express.Request, res: express.Response) => {
            var resource = new ResourceFile();
            resource = req.body;
            this.manager.addResource(resource, false, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        /** update/add a resource type file, overwrites if it already exists */
        this.server.put(this.resourceUrl, (req: express.Request, res: express.Response) => {
            var resource = new ResourceFile();
            resource = req.body;
            this.manager.addResource(resource, true, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        // get an existing resource type file
        this.server.get(this.resourceUrl + ':resourceId', (req: express.Request, res: express.Response) => {
            this.manager.getResource(req.params.resourceId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                if (result.result === ApiResult.OK) {
                    res.send(this.cloneWithoutUnderscore(result.resource));
                }
                else {
                    res.sendStatus(result.result);
                }
            });
            //res.send(JSON.stringify(this.manager.getResource(req.params.resourceId.toLowerCase())));
        });

        // get all available public layers
        this.server.get(this.layersUrl, (req: express.Request, res: express.Response) => {
            res.send(JSON.stringify(this.manager.layers));
        });

        //------ Project API paths, in CRUD order

        // get all available projects
        this.server.get(this.projectsUrl, (req: express.Request, res: express.Response) => {
            res.send(JSON.stringify(this.manager.projects));
        });

        // create a new project
        this.server.post(this.projectsUrl, (req: express.Request, res: express.Response) => {
            var project = new Project();
            project = req.body;
            this.manager.addProject(project, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                if (result.result === ApiResult.OK || result.result === ApiResult.ProjectAlreadyExists) {
                    res.send(result.project);
                }
            });
        });

        // gets the entire project
        this.server.get(this.projectsUrl + ':projectId', (req: any, res: any) => {
            this.manager.getProject(req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                if (result.result === ApiResult.OK) {
                    res.send(result.project);
                } else {
                    res.sendStatus(result.result);
                }
            });
        });

        //Updates EVERY layer in the project.
        this.server.put(this.projectsUrl + ':projectId', (req: any, res: any) => {
            req.projectId = req.params.projectId;
            this.manager.updateProject(req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.sendStatus(result.result);
            });
        });

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.delete(this.projectsUrl + ':projectId', (req: any, res: any) => {
            this.manager.deleteProject(req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.sendStatus(result.result);
            });
        });

        //adds a layer to a project
        this.server.post(this.projectsUrl + ':projectId/group/:groupId/layer/:layerId', (req: express.Request, res: express.Response) => {
            this.manager.addLayerToProject(req.params.projectId, req.params.groupId, req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        //removes a layer from a project
        this.server.delete(this.projectsUrl + ':projectId/group/:groupId/layer/:layerId', (req: express.Request, res: express.Response) => {
            this.manager.removeLayerFromProject(req.params.projectId, req.params.groupId, req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        this.server.get(this.projectsUrl + ':projectId/group/', (req: any, res: any) => {
            this.manager.allGroups(req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                if (result.result === ApiResult.OK) {
                    res.send(result.groups);
                } else {
                    res.sendStatus(result.result);
                }
            });
        });

        this.server.post(this.projectsUrl + ':projectId/group/', (req: any, res: any) => {
            var group = new Group();
            group = req.body;
            this.manager.addGroup(group, req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        this.server.delete(this.projectsUrl + ':projectId/group/:groupId', (req: any, res: any) => {
            this.manager.removeGroup(req.params.groupId, req.params.projectId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        //------ layer API paths, in CRUD order

        // Or post to a layer collection that should be shielded-off (e.g. system or users)
        // And what if an agent starts sending gibberish?
        this.server.post(this.layersUrl, (req: express.Request, res: express.Response) => {
            var layer = new Layer();
            //layer.features = req.body.features;
            layer = <Layer>req.body;
            this.manager.addUpdateLayer(layer, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.sendStatus(result.result);
            });
        });

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.get(this.layersUrl + ':layerId', (req: any, res: any) => {
            this.manager.getLayer(req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                if (result.result === ApiResult.OK) {
                    res.send(result.layer);
                } else {
                    res.sendStatus(result.result);
                }
            });
        });

        //Updates EVERY feature in the layer.
        this.server.put(this.layersUrl + ':layerId', (req: any, res: any) => {
            req.layerId = req.params.layerId;
            this.manager.addUpdateLayer(req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.sendStatus(result.result);
            });
        });

        /** creates a new layer, returns an error if it already exists */
        this.server.post(this.layersUrl + ':layerId', (req: any, res: any) => {
            req.layerId = req.params.layerId;
            if (this.manager.layers.hasOwnProperty(req.layerId)) {
                res.sendStatus(ApiResult.LayerAlreadyExists);
            }
            else {
                this.manager.addUpdateLayer(req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                    //todo: check error
                    res.sendStatus(result.result);
                });
            }
        });

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.delete(this.layersUrl + ':layerId', (req: any, res: any) => {
            this.manager.deleteLayer(req.params.layerId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.sendStatus(result.result);
            });
        });

        //------ feature API paths, in CRUD order

        //adds a feature
        this.server.post(this.layersUrl + ':layerId/feature', (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layerId, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        //returns a feature
        this.server.get(this.layersUrl + ':layerId/feature/:featureId', (req: express.Request, res: express.Response) => {
            this.manager.getFeature(req.params.layerId, req.params.featureId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.sendStatus(result.result);
            });
        });

        // updates a feature corresponding to a query on ID (should be one)
        // Takes a feature as input in the body of the PUT request
        this.server.put(this.layersUrl + ':layerId/feature/:featureId', (req: express.Request, res: express.Response) => {
            var feature = new Feature();
            feature = req.body;
            this.manager.updateFeature(req.params.layerId, feature, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // for some reason (TS?) express doesn't work with del as http verb
        // unlike the JS version, which simply uses del as a keyword.
        // deletes a feature
        this.server.delete(this.layersUrl + ':layerId/feature/:featureId', (req: express.Request, res: express.Response) => {
            this.manager.deleteFeature(req.params.layerId, req.params.featureId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        this.server.get(this.searchUrl + ':keyword', (req: express.Request, res: express.Response) => {
            this.manager.searchLayers(req.params.keyword, [], <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // LOGS

        // addLog
        this.server.put(this.layersUrl + ':layerId/:featureId/log', (req: express.Request, res: express.Response) => {
            this.manager.addLog(req.params.layerId, req.params.featureId, req.body.prop, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                console.log('received log');
                res.send(result);
            });
        });

        //getLog (path doesnt make sense)
        this.server.get(this.layersUrl + ':layerId/:featureId/log', (req: express.Request, res: express.Response) => {
            this.manager.getLog(req.params.layerId, req.params.featureId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        //deleteLog
        this.server.delete(this.layersUrl + ':layerId/:featureId/log', (req: express.Request, res: express.Response) => {
            this.manager.deleteLog(req.params.layerId, req.params.featureId, req.body.ts, req.body.prop, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // updates all features corresponding to query on ID (should be one)
        this.server.put(this.layersUrl + ':layerId/:featureId/logs', (req: express.Request, res: express.Response) => {
            var logs: { [key: string]: Logs[] };
            logs = req.body;
            this.manager.updateLogs(req.params.layerId, req.params.featureId, logs, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // Some geospatial queries that are only supported for mongo.
        // We chose to work with GET and params here for ease of accessibility
        // (majority of web APIs implement similar constructions)

        // gets all points in a rectangular shape.
        this.server.get(this.layersUrl + ':layerId/bbox', (req: express.Request, res: express.Response) => {
            var southWest: number[] = [Number(req.query.swlng), Number(req.query.swlat)];
            var northEast: number[] = [Number(req.query.nelng), Number(req.query.nelat)];
            this.manager.getBBox(req.params.layerId, southWest, northEast, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // fetches all points in a spherical method
        this.server.get(this.layersUrl + ':layerId/getsphere', (req: express.Request, res: express.Response) => {
            this.manager.getSphere(req.params.layerId, Number(req.query.maxDistance), Number(req.query.lng), Number(req.query.lat), <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                // this.server.post(this.sensorsUrl + ':sensorId', (req: express.Request, res: express.Response) => {
                //     this.manager.addSensor(req.body, (result: CallbackResult) => { res.send(result) });
                // });
                //todo: check error
                res.send(result);
            });
        });

        //works with post - so we can receive a GeoJSON as input
        this.server.post(this.layersUrl + ':layerId/getwithinpolygon', (req: express.Request, res: express.Response) => {
            var feature: Feature = req.body;
            // this.server.get(this.sensorsUrl, (req: express.Request, res: express.Response) => {
            //     this.manager.getSensors((result: CallbackResult) => { res.send(result) });
            // });
            this.manager.getWithinPolygon(req.params.layerId, feature, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        //update a key
        this.server.post(this.keysUrl + ':keyId', (req: express.Request, res: express.Response) => {
            this.manager.updateKey(req.params.keyId, req.body, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        //get all keys
        this.server.get(this.keysUrl, (req: express.Request, res: express.Response) => {
            this.manager.getKeys(<ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result.keys);
            });
        });

        //get a key
        this.server.get(this.keysUrl + ':keyId', (req: express.Request, res: express.Response) => {
            this.manager.getKey(req.params.keyId, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                res.send(result.key);
            });
        });

        //add file
        this.server.post(this.filesUrl + ':folderId/:fileName', (req: express.Request, res: express.Response) => {
            if (!req.body.hasOwnProperty('base64')) {
                Winston.error('Error receiving base64 encoded image: post the data as JSON, with the base64 property set to the base64 encoded string!');
                return;
            }
            this.manager.addFile(req.body['base64'], req.params.folderId, req.params.fileName, <ApiMeta>{ source: 'rest' }, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // proxy service
        this.server.get(this.proxyUrl, (req, res) => {
            var id = req.query.url;
            console.log(id);
            this.getUrl(id, req, res);
        });

        callback();
    }

    private getUrl(feedUrl: string, req: express.Request, res: express.Response) {
        Winston.info('proxy request 2: ' + feedUrl);
        //feedUrl = 'http://rss.politie.nl/rss/algemeen/ab/algemeen.xml';
        var options = {
            method: 'get',
            headers: req.headers
        };


        var parseNumbers = function (str) {
            if (!isNaN(str)) {
                str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
            }
            return str;
        };

        request(feedUrl, options, function (error, response, xml) {
            if (!error && response.statusCode === 200) {
                res.send(xml);

            } else {
                res.statusCode = 404;
                res.end();
            }
        });
    }

    private cloneWithoutUnderscore(v: any): any {
        if (typeof v !== 'object') return v;
        if (v instanceof Array) {
            var a = [];
            v.forEach((i) => {
                a.push(this.cloneWithoutUnderscore(i));
            });
            return a;
        } else {
            var c = {};
            for (var k in v) {
                if (k[0] !== '_') c[k] = this.cloneWithoutUnderscore(v[k]);
            }
            return c;
        }
    }


}
