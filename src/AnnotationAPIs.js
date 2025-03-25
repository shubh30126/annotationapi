import fetchCall from "./fetchUtil";

export const getAnnotations = () => fetchCall({
    url: `https://annotationapidemo.firebaseio.com/annots/shdixit/annotations.json`,
    method: "GET",
});

export const updateAnnotations = body => fetchCall({
    url: `https://annotationapidemo.firebaseio.com/annots/shdixit/annotations.json`,
    method: "PUT",
    body,
});

export const startAnnotationMode = (mode) => {
    // Convert mode to lowercase if not already
    const lowerMode = mode.toLowerCase();
    
    // Valid annotation modes
    const validModes = ['note', 'highlight', 'shape', 'underline', 'strikeout', 'freetext', 'eraser'];
    
    if (!validModes.includes(lowerMode)) {
        throw new Error(`Invalid annotation mode: ${mode}. Valid modes are: ${validModes.join(', ')}`);
    }
    
    // Return the validated lowercase mode
    return lowerMode;
};

export default {
    getAnnotations,
    updateAnnotations,
    startAnnotationMode,
};
