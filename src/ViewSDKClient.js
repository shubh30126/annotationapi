/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

class ViewSDKClient {
    constructor() {
        this.readyPromise = new Promise((resolve) => {
            if (window.AdobeDC) {
                resolve();
            } else {
                /* Wait for Adobe Document Cloud View SDK to be ready */
                document.addEventListener("adobe_dc_view_sdk.ready", () => {
                    resolve();
                });
            }
        });
        this.adobeDCView = null;
        this.adobeViewer = null;
        this.annotationManager = null;
        this.apis = null;
    }

    ready() {
        return this.readyPromise;
    }

    previewFile(divId, viewerConfig) {
        /* Initialize the AdobeDC View object */
        this.adobeDCView = new window.AdobeDC.View({
            /* Pass your registered client id */
            clientId: "8c0cd670273d451cbc9b351b11d22318",
            /* Pass the div id in which PDF should be rendered */
            divId,
        });

        const previewFilePromise = this.adobeDCView.previewFile({
            content: {
                location: {
                    url: "https://documentcloud.adobe.com/view-sdk/PDFs/Benchmark.pdf",
                },
            },
            metaData: {
                fileName: "Bodea Brochure.pdf",
                id: "6d07d124-ac85-43b3-a867-36930f502ac6",
            }
        }, {
            ...viewerConfig,
            enableSearchAPIs: true,
            enableAnnotationAPIs: true,
        });

        return previewFilePromise.then(adobeViewer => {
            this.adobeViewer = adobeViewer;
            return this.adobeViewer.getAPIs().then(apis => {
                this.apis = apis;
                return this.adobeViewer.getAnnotationManager().then(annotManager => {
                    this.annotationManager = annotManager;
                    
                    // Register annotation events immediately when annotation manager is ready
                    if (this.annotationEventListener) {
                        this.setupAnnotationEvents();
                    }
                    
                    // Initialize all controls after we have the APIs
                    this.addZoomControls();
                    this.addPageNavigationControls();
                    this.addSearchControls();
                    
                    // Get initial page info
                    return this.getCurrentPage().then(currentPage => {
                        return this.getTotalPages().then(totalPages => {
                            if (viewerConfig.onPagesInfoUpdate) {
                                viewerConfig.onPagesInfoUpdate(currentPage, totalPages);
                            }
                            return this.adobeViewer;
                        });
                    });
                });
            });
        });
    }

    previewFileUsingFilePromise(divId, filePromise, fileName) {
        /* Initialize the AdobeDC View object */
        this.adobeDCView = new window.AdobeDC.View({
            /* Pass your registered client id */
            clientId: "8c0cd670273d451cbc9b351b11d22318",
            /* Pass the div id in which PDF should be rendered */
            divId,
        });

        /* Invoke the file preview API on Adobe DC View object */
        this.adobeDCView.previewFile({
            /* Pass information on how to access the file */
            content: {
                /* pass file promise which resolve to arrayBuffer */
                promise: filePromise,
            },
            /* Pass meta data of file */
            metaData: {
                /* file name */
                fileName: fileName
            }
        }, {});
    }

    registerSaveApiHandler() {
        /* Define Save API Handler */
        const saveApiHandler = (metaData, content, options) => {
            console.log(metaData, content, options);
            return new Promise(resolve => {
                /* Dummy implementation of Save API, replace with your business logic */
                setTimeout(() => {
                    const response = {
                        code: window.AdobeDC.View.Enum.ApiResponseCode.SUCCESS,
                        data: {
                            metaData: Object.assign(metaData, {updatedAt: new Date().getTime()})
                        },
                    };
                    resolve(response);
                }, 2000);
            });
        };

        this.adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.SAVE_API,
            saveApiHandler,
            {}
        );
    }

    registerEventsHandler() {
        /* Register the callback to receive the events */
        this.adobeDCView.registerCallback(
            /* Type of call back */
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            /* call back function */
            event => {
                console.log(event);
            },
            /* options to control the callback execution */
            {
                /* Enable PDF analytics events on user interaction. */
                enablePDFAnalytics: true,
            }
        );
    }

    // Zoom controls
    addZoomControls() {
        this.zoomIn = () => {
            if (this.apis) {
                const zoomAPIs = this.apis.getZoomAPIs();
                zoomAPIs.zoomIn();
            }
        };

        this.zoomOut = () => {
            if (this.apis) {
                const zoomAPIs = this.apis.getZoomAPIs();
                zoomAPIs.zoomOut();
            }
        };
    }

    // Page navigation controls
    addPageNavigationControls() {
        this.getCurrentPage = () => {
            if (this.apis) {
                return this.apis.getCurrentPage();
            }
            return Promise.resolve(1);
        };

        this.getTotalPages = () => {
            if (this.apis) {
                return this.apis.getPDFMetadata().then(metadata => metadata.numPages);
            }
            return Promise.resolve(1);
        };

        this.gotoPage = (pageNumber) => {
            if (this.adobeViewer) {
                return this.apis.gotoLocation(pageNumber);
            }
            return Promise.resolve();
        };

        this.nextPage = async () => {
            if (!this.adobeViewer) return 1;
            const currentPage = await this.getCurrentPage();
            const totalPages = await this.getTotalPages();
            
            if (currentPage < totalPages) {
                await this.gotoPage(currentPage + 1);
                return currentPage + 1;
            }
            return currentPage;
        };

        this.previousPage = async () => {
            if (!this.adobeViewer) return 1;
            const currentPage = await this.getCurrentPage();
            
            if (currentPage > 1) {
                await this.gotoPage(currentPage - 1);
                return currentPage - 1;
            }
            return currentPage;
        };
    }

    // Search controls
    addSearchControls() {
        this.search = async (searchText) => {
            if (!this.apis) return null;
            
            try {
                // Start the search and get search object
                const searchObject = await this.apis.search(searchText);
                let latestState = null;

                // Create a promise to handle search results
                return new Promise((resolve) => {
                    // Register callback for search results updates
                    searchObject.onResultsUpdate((searchResult) => {
                        console.log('Search Result:', searchResult); // Debug log
                        
                        // Create current state
                        latestState = {
                            searchObject,
                            totalMatches: searchResult.totalResults || 0,
                            currentMatch: searchResult.currentResult ? searchResult.currentResult.index + 1 : 0,
                            pageNumber: searchResult.currentResult ? searchResult.currentResult.pageNumber : null,
                            status: searchResult.status,
                            noResults: searchResult.totalResults === 0
                        };

                        // Always resolve with the latest state for immediate feedback
                        resolve(latestState);
                    });
                });
            } catch (error) {
                console.error('Search error:', error);
                return null;
            }
        };

        this.nextMatch = async (searchObject) => {
            if (!searchObject) return null;
            try {
                const result = await searchObject.next();
                if (!result) return null;

                return {
                    searchObject,
                    currentMatch: result.index + 1,
                    pageNumber: result.pageNumber,
                    totalMatches: searchObject.totalResults || 0,
                    status: 'FOUND'
                };
            } catch (error) {
                console.error('Next match error:', error);
                return null;
            }
        };

        this.previousMatch = async (searchObject) => {
            if (!searchObject) return null;
            try {
                const result = await searchObject.previous();
                if (!result) return null;

                return {
                    searchObject,
                    currentMatch: result.index + 1,
                    pageNumber: result.pageNumber,
                    totalMatches: searchObject.totalResults || 0,
                    status: 'FOUND'
                };
            } catch (error) {
                console.error('Previous match error:', error);
                return null;
            }
        };

        this.clearSearch = async (searchObject) => {
            if (!searchObject) return;
            try {
                await searchObject.clear();
            } catch (error) {
                console.error('Clear search error:', error);
            }
        };
    }

    getAnnotationManager() {
        return this.annotationManager;
    }

    registerEventListener(eventListener) {
        this.annotationEventListener = eventListener;
        
        // Setup events if annotation manager is already available
        if (this.annotationManager) {
            this.setupAnnotationEvents();
        }
    }

    setupAnnotationEvents() {
        // Clear any existing callbacks first to prevent duplicates
        this.annotationManager.unregisterCallback('AnnotationModeStarted');
        this.annotationManager.unregisterCallback('AnnotationModeEnded');
        
        // Register the callbacks
        this.annotationManager.registerCallback('AnnotationModeStarted', (event) => {
            console.log("Annotation mode started");
            console.log("Selected tool:", event.tool);
            
            if (this.annotationEventListener) {
                this.annotationEventListener('ANNOTATION_MODE_STARTED', event.tool);
            }
        });

        this.annotationManager.registerCallback('AnnotationModeEnded', (event) => {
            console.log("Annotation mode ended");
            
            if (this.annotationEventListener) {
                this.annotationEventListener('ANNOTATION_MODE_ENDED', event);
            }
        });
    }

    // Add method to get APIs
    getAPIs() {
        return this.apis;
    }

    isReady() {
        return !!(this.adobeViewer && this.annotationManager && this.apis);
    }

    startAnnotationMode(mode, options = {}) {
        if (this.annotationManager) {
            // End any existing annotation mode first
            this.endAnnotationMode();
            // Start the new annotation mode
            return this.annotationManager.startAnnotationMode(mode, options);
        }
    }

    endAnnotationMode() {
        if (this.annotationManager) {
            return this.annotationManager.endAnnotationMode();
        }
    }
}

export default ViewSDKClient;
