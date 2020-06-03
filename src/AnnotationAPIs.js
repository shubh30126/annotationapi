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

export default {
    getAnnotations,
    updateAnnotations,
};
