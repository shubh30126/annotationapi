/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

import React, { Component } from "react";
import classNames from "classnames";
import Button from '@material-ui/core/Button';
import CommentIcon from '@material-ui/icons/Comment';
import FormatStrikethroughIcon from '@material-ui/icons/FormatStrikethrough';
import FormatUnderlinedIcon from '@material-ui/icons/FormatUnderlined';
import BrushIcon from '@material-ui/icons/Brush';
import CachedIcon from '@material-ui/icons/Cached';
import { FaHighlighter } from 'react-icons/fa';
import { AiOutlineImport } from 'react-icons/ai';
import { TiExport } from 'react-icons/ti';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';
import { getAnnotations, updateAnnotations } from "./AnnotationAPIs";
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip,
    withStyles
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import "./CustomUI.css";
import clsx from 'clsx';

const styles = (theme) => ({
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
    },
    header: {
        padding: theme.spacing(2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
    },
    title: {
        fontWeight: 500,
    },
    content: {
        flexGrow: 1,
        overflow: 'auto',
        padding: theme.spacing(2),
    },
    list: {
        padding: 0,
    },
    listItem: {
        marginBottom: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
        '&.selected': {
            backgroundColor: theme.palette.action.selected,
        },
    },
    selectedItem: {
        backgroundColor: theme.palette.action.selected,
        '&:hover': {
            backgroundColor: theme.palette.action.selected,
        },
    },
    annotationContent: {
        padding: theme.spacing(2),
    },
    annotationMeta: {
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.text.secondary,
        fontSize: '0.875rem',
        marginTop: theme.spacing(1),
    },
    pageNumber: {
        marginLeft: 'auto',
    },
    actions: {
        display: 'flex',
        gap: theme.spacing(1),
    },
    noAnnotations: {
        padding: theme.spacing(4),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    iconButton: {
        padding: theme.spacing(1),
        color: theme.palette.primary.main,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    toolbar: {
        padding: theme.spacing(1),
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(0.5),
        backgroundColor: theme.palette.background.default,
        borderRadius: theme.shape.borderRadius,
        margin: theme.spacing(1),
    },
    toolButton: {
        minWidth: 36,
        width: 36,
        height: 36,
        padding: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
        '&.selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light,
            '&:hover': {
                backgroundColor: theme.palette.primary.light,
            },
        },
    },
    toolIcon: {
        fontSize: 20,
    },
    colorPicker: {
        width: 36,
        height: 36,
        padding: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        cursor: 'pointer',
        backgroundColor: theme.palette.background.paper,
        '&::-webkit-color-swatch': {
            borderRadius: 'inherit',
            border: 'none',
        },
        '&::-webkit-color-swatch-wrapper': {
            padding: 0,
        },
    },
    annotationCount: {
        marginLeft: theme.spacing(1),
        color: theme.palette.text.secondary,
    },
});

class AnnotationListItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inEditMode: false,
            editInputValue: undefined
        };
        this.userName = this.props.annotation.creator.name;
    }

    /* Bind editAnnotation to edit button. */
    editButtonOnClick = e => {
        e.stopPropagation();
        /* If in editMode */
        if (this.state.inEditMode) {
            this.editAnnotation(this.props.annotation);
            /* toggle editMode */
            this.setState({
                inEditMode: false
            });
        } else {
            /* Default input value */
            if (!this.state.editInputValue) {
                this.setState({
                    editInputValue: this.props.annotation.bodyValue
                });
            }
            /* toggle editMode */
            this.setState({
                inEditMode: true
            });
        }
    };

    /* Bind deleteAnnotation to delete button. */
    deleteButtonOnClick = e => {
        e.stopPropagation();
        this.deleteAnnotation(this.props.annotation.id);
    };

    listItemOnClick = e => {
        e.stopPropagation();
        const annotationManager = this.props.viewSDKClient?.getAnnotationManager();
        if (annotationManager) {
            annotationManager.selectAnnotation(this.props.annotation.id)
                .then(() => { })
                .catch(error => {
                    console.log(error);
                });
        }
    };

    editInputOnChange = e => {
        e.persist();
        this.setState({
            editInputValue: e.target.value
        });
    };

    /* Edit an existing annotation using Annotation API and update the list item as well. */
    editAnnotation = annotation => {
        annotation.bodyValue = this.state.editInputValue;
        const annotationManager = this.props.viewSDKClient?.getAnnotationManager();
        if (annotationManager) {
            annotationManager.updateAnnotation(annotation)
                .then(() => {
                    console.log("Annotation updated successfully.");
                })
                .catch(error => {
                    console.log(error);
                });
        }
    };

    /* Delete an existing annotation from Annotation API (the same will be removed from list as well) */
    deleteAnnotation = annotationId => {
        const filter = {
            annotationIds: [annotationId]
        };
        const annotationManager = this.props.viewSDKClient?.getAnnotationManager();
        if (annotationManager) {
            annotationManager.deleteAnnotations(filter)
                .then(() => {
                    console.log("Annotation deleted successfully.");
                })
                .catch(error => {
                    console.log(error);
                });
        }
    };

    getInitial = () => {
        return this.userName.charAt(0).toUpperCase();
    };

    timeDifference = (current, previous) => {

        const prevDate = new Date(previous).getTime();

        let msPerMinute = 60 * 1000;
        let msPerHour = msPerMinute * 60;
        let msPerDay = msPerHour * 24;
        let msPerMonth = msPerDay * 30;

        var elapsed = current - prevDate;

        if (elapsed < msPerMinute) {
            return 'few seconds ago';
        } else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + ' minutes ago';
        } else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + ' hours ago';
        } else if (elapsed < msPerMonth) {
            return Math.round(elapsed / msPerDay) + ' days ago';
        } else {
            return Math.round(elapsed / msPerMonth) + ' months ago';
        }
    };

    render() {
        const {
            inEditMode,
        } = this.state;

        const {
            annotation,
            selectedAnnotationId
        } = this.props;

        return (
            <li
                id={annotation.id}
                className={ classNames([ "effect7",
                    selectedAnnotationId === annotation.id ? "selected" : "unselected"])
                }
                onClick={this.listItemOnClick}
            >
                <div className="user-details">
                    <div className="user-logo">{this.getInitial()}</div>
                    <label className="user-name"> {this.userName} </label>
                    <label className="time">{this.timeDifference(Date.now(), annotation.created)}</label>
                    <div className="comments-actions">
                        <div className="edit" onClick={this.editButtonOnClick}>
                            {
                                inEditMode ? <IconButton size="small">
                                    <SaveIcon fontSize="inherit" />
                                </IconButton> : <IconButton size="small">
                                    <EditIcon fontSize="inherit" />
                                </IconButton>
                            }
                        </div>
                        <div className="delete" onClick={this.deleteButtonOnClick}><IconButton size="small">
                            <DeleteIcon fontSize="inherit" />
                        </IconButton></div>
                    </div>
                </div>

                {
                    inEditMode ?
                        <textarea type="text" className="edit-text" defaultValue={annotation.bodyValue} onChange={this.editInputOnChange} /> :
                        <label className="comments">{annotation.bodyValue}</label>
                }
            </li>
        );
    }
}

class CustomRHP extends Component {
    constructor(props) {
        super(props);
        this.colorRef = React.createRef();
        this.state = {
            annotationListItems: [],
            selectedAnnotationId: undefined,
            selectedTool: "",
            color: "#fccb00",
            imported: false,
            exporting: false,
            importing: false,
            page: 0,
            open: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.viewSDKClient?.adobeViewer && !prevProps.viewSDKClient?.adobeViewer) {
            this.props.viewSDKClient.adobeViewer.getAnnotationManager().then(annotManager => {
                annotManager.registerEventListener(this.annotationEventListener);
            });
        }
    }

    annotationEventListener = event => {
        console.log('Annotation event:', event);
        
        if (event.type === "ANNOTATION_ADDED") {
            if (event.data.bodyValue) {
                this.onAnnotationAdded(event.data);
            } else {
                this.selectedAnnotation = event.data;
                this.setState({ open: true });
            }
        }
        if (event.type === "ANNOTATION_DELETED") {
            this.onAnnotationDeleted(event.data.id);
        }
        if (event.type === "ANNOTATION_MODE_ENDED") {
            this.setState({ selectedTool: "" });
        }
        if (event.type === "ANNOTATION_MODE_STARTED") {
            // Map the Adobe SDK tool names to our UI tool names
            const toolMap = {
                'note': 'STICKY_NOTE',
                'shape': 'DRAWING',  // Map shape to DRAWING for our UI
                'highlight': 'HIGHLIGHT',
                'underline': 'UNDERLINE',
                'strikeout': 'STRIKEOUT',
                'freetext': 'FREETEXT',
                'eraser': 'ERASER'
            };
            const toolName = toolMap[event.data] || event.data.toUpperCase();
            console.log('Setting tool to:', toolName); // Debug log
            this.setState({ selectedTool: toolName });
        }
        if (event.type === "ANNOTATION_SELECTED") {
            this.toggleSelectedAnnotation(event.data.id);
        }
        if (event.type === "ANNOTATION_UNSELECTED") {
            this.toggleSelectedAnnotation();
        }
    };

    /* This will add a new annotation list item to list maintained in state */
    onAnnotationAdded = annotation => {
        this.setState({
            annotationListItems: [...this.state.annotationListItems, annotation]
        });
    };

    /* This will delete the annotation list item from list maintained in state */
    onAnnotationDeleted = id => {
        this.setState({
            annotationListItems: this.state.annotationListItems.filter(item => item.id !== id)
        });
    };

    /* This will set/unset selected annotation id in state */
    toggleSelectedAnnotation = id => {
        this.setState({
            selectedAnnotationId: id
        });
    };

    addCommentText = () => {
        const annotation = this.selectedAnnotation;
        const type = annotation.target.selector.subtype;
        const comment = document.getElementById("name").value || "Added a " + type;
        annotation.bodyValue = comment;
        this.setState({ open: false });
        const annotationManager = this.props.viewSDKClient?.getAnnotationManager();
        if (annotationManager) {
            annotationManager.updateAnnotation(annotation)
                .then(() => {
                    console.log("Annotation updated successfully.");
                    this.onAnnotationAdded(annotation);
                })
                .catch(error => {
                    console.log(error);
                });
        }
    };

    handleToolClick = async (toolName) => {
        const annotationManager = this.props.viewSDKClient?.getAnnotationManager();
        if (!annotationManager) return;

        // Map the tool names to the correct annotation modes
        const toolToModeMap = {
            'STICKY_NOTE': 'note',
            'HIGHLIGHT': 'highlight',
            'SHAPE': 'shape',
            'UNDERLINE': 'underline',
            'STRIKEOUT': 'strikeout',
            'FREETEXT': 'freetext',
            'DRAWING': 'shape',  // Map DRAWING to shape mode
            'ERASER': 'eraser'
        };

        try {
            if (this.state.selectedTool === toolName) {
                console.log('Ending annotation mode'); // Debug log
                await annotationManager.endAnnotationMode();
                // State will be updated via event listener
            } else {
                const mode = toolToModeMap[toolName] || toolName.toLowerCase();
                console.log('Starting annotation mode:', mode); // Debug log
                await annotationManager.startAnnotationMode(mode, { 
                    defaultColor: this.state.color 
                });
                // State will be updated via event listener
            }
        } catch (error) {
            console.error('Error toggling annotation mode:', error);
        }
    };

    onColorChange = () => {
        const color = this.colorRef.current.value;
        this.setState({ color });
        if (this.state.selectedTool) {
            const annotationManager = this.props.viewSDKClient?.getAnnotationManager();
            if (annotationManager) {
                annotationManager.startAnnotationMode(this.state.selectedTool, { 
                    defaultColor: color 
                });
            }
        }
    };

    onExpandClick = page => {
        if (page !== this.state.page) {
            this.setState({ page });
            this.props.viewSDKClient.getAPIs().gotoLocation(page);
        } else {
            this.setState({ page: 0 });
        }
    };

    // Group annotations by page
    getAnnotationsByPage = () => {
        const annotationsByPage = {};
        this.state.annotationListItems.forEach(annotation => {
            const page = annotation.target?.selector?.node?.page || 1;
            if (!annotationsByPage[page]) {
                annotationsByPage[page] = [];
            }
            annotationsByPage[page].push(annotation);
        });
        return annotationsByPage;
    };

    render() {
        const { classes, handleDrawerClose } = this.props;
        const { annotationListItems, selectedAnnotationId, selectedTool, color, page } = this.state;
        const annotationsByPage = this.getAnnotationsByPage();

        return (
            <div className={classes.root}>
                <Box className={classes.header}>
                    <Typography variant="h6" className={classes.title}>
                        Comments
                    </Typography>
                    <Tooltip title="Close panel">
                        <IconButton 
                            onClick={handleDrawerClose}
                            size="small"
                            color="inherit"
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                
                <Divider />

                <div className={classes.toolbar}>
                    <Tooltip title="Comment">
                        <IconButton
                            className={clsx(classes.toolButton, selectedTool === 'STICKY_NOTE' && 'selected')}
                            onClick={() => this.handleToolClick('STICKY_NOTE')}
                        >
                            <CommentIcon className={classes.toolIcon} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Highlight">
                        <IconButton
                            className={clsx(classes.toolButton, selectedTool === 'HIGHLIGHT' && 'selected')}
                            onClick={() => this.handleToolClick('HIGHLIGHT')}
                        >
                            <FaHighlighter className={classes.toolIcon} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Strikethrough">
                        <IconButton
                            className={clsx(classes.toolButton, selectedTool === 'STRIKEOUT' && 'selected')}
                            onClick={() => this.handleToolClick('STRIKEOUT')}
                        >
                            <FormatStrikethroughIcon className={classes.toolIcon} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Underline">
                        <IconButton
                            className={clsx(classes.toolButton, selectedTool === 'UNDERLINE' && 'selected')}
                            onClick={() => this.handleToolClick('UNDERLINE')}
                        >
                            <FormatUnderlinedIcon className={classes.toolIcon} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Draw">
                        <IconButton
                            className={clsx(classes.toolButton, selectedTool === 'DRAWING' && 'selected')}
                            onClick={() => this.handleToolClick('DRAWING')}
                        >
                            <BrushIcon className={classes.toolIcon} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Color">
                        <input
                            type="color"
                            ref={this.colorRef}
                            value={color}
                            onChange={this.onColorChange}
                            className={classes.colorPicker}
                        />
                    </Tooltip>
                </div>

                <Divider />
                
                <div className={classes.content}>
                    {annotationListItems.length > 0 ? (
                        Object.entries(annotationsByPage).map(([pageNum, annotations]) => (
                            <React.Fragment key={pageNum}>
                                <Accordion 
                                    expanded={page === parseInt(pageNum)}
                                    onChange={() => this.onExpandClick(parseInt(pageNum))}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>Page {pageNum}</Typography>
                                        <Typography className={classes.annotationCount}>
                                            ({annotations.length})
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List className={classes.list}>
                                            {annotations.map((annotation) => (
                                                <AnnotationListItem 
                                                    key={annotation.id}
                                                    annotation={annotation}
                                                    selectedAnnotationId={selectedAnnotationId}
                                                    viewSDKClient={this.props.viewSDKClient}
                                                />
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            </React.Fragment>
                        ))
                    ) : (
                        <div className={classes.noAnnotations}>
                            <CommentIcon style={{ fontSize: 48, opacity: 0.5 }} />
                            <Typography variant="body1" style={{ marginTop: 16 }}>
                                No comments yet
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Add comments to the document using the annotation tools
                            </Typography>
                        </div>
                    )}
                </div>

                <Dialog open={this.state.open} onClose={() => this.setState({ open: false })}>
                    <DialogTitle>Add Comment</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Comment"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => this.setState({ open: false })} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={this.addCommentText} color="primary">
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withStyles(styles)(CustomRHP);
