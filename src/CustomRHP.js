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
import Divider from "@material-ui/core/Divider";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import "./CustomUI.css";

class ListItem extends Component {
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
        this.props.annotationManager.selectAnnotation(this.props.annotation.id)
            .then(() => { })
            .catch(error => {
                console.log(error);
            });
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
        this.props.annotationManager.updateAnnotation(annotation)
            .then(() => {
                console.log("Annotation updated successfully.");
            })
            .catch(error => {
                console.log(error);
            });
    };

    /* Delete an existing annotation from Annotation API (the same will be removed from list as well) */
    deleteAnnotation = annotationId => {
        const filter = {
            annotationIds: [annotationId]
        };
        this.props.annotationManager.deleteAnnotations(filter)
            .then(() => {
                console.log("Annotation deleted successfully.");
            })
            .catch(error => {
                console.log(error);
            });
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
    constructor() {
        super();
        this.colorRef = React.createRef();
    }
    state = {
        annotationListItems: [],
        selectedAnnotationId: undefined,
        selectedTool: "",
        color: "#fccb00",
        imported: false,
        exporting: false,
        importing: false,
        page: 0,
    };

    callback= false;

    componentDidUpdate(prevProps) {
        if (this.props.viewSDKClient && this.props.viewSDKClient.adobeDCView && !this.callback) {
            this.callback = true;
            this.props.viewSDKClient.adobeDCView.registerCallback(window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER, event => {
                if (event.type === "CURRENT_ACTIVE_PAGE" || event.type === "PREVIEW_PAGE_MOUSE_ENTER") {
                    this.setState({ page: event.data.pageNumber });
                }
            }, {
                enableFilePreviewEvents: true,
            });
            window.adobeViewer.getAPIs().then(apis => {
                this.apis = apis;
            });
        }
        if (!prevProps.annotationManager && this.props.annotationManager) {
            this.props.annotationManager.registerEventListener(this.annotationEventListener);
        }
    }

    annotationEventListener = event => {
        if (event.type === "ANNOTATION_ADDED") {
            if (event.data.bodyValue) {
                this.onAnnotationAdded(event.data);
            } else {
                this.addCommentText(event.data);
            }
        }
        if (event.type === "ANNOTATION_DELETED") {
            this.onAnnotationDeleted(event.data.id);
        }
        if (event.type === "ANNOTATION_MODE_ENDED" && this.state.selectedTool) {
            this.setState({ selectedTool: "" });
        }
        if (event.type === "ANNOTATION_SELECTED") {
            this.toggleSelectedAnnotation(event.data.id);
        }
        if (event.type === "ANNOTATION_UNSELECTED") {
            this.toggleSelectedAnnotation();
        }
        console.log(event);
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

    addCommentText = annotation => {
        const type = annotation.target.selector.subtype;
        const comment = prompt("Enter the text associated with " + type, "Added a " + type) || "Added a " + type;
        annotation.bodyValue = comment;
        this.props.annotationManager.updateAnnotation(annotation)
            .then(() => {
                console.log("Annotation updated successfully.");
                this.onAnnotationAdded(annotation);
            })
            .catch(error => {
                console.log(error);
            });
    };

    onToolsClick = tool => {
        if (this.state.selectedTool === tool) {
            this.setState({ selectedTool: "" });
            this.props.annotationManager.endAnnotationMode();
        } else {
            this.setState({ selectedTool: tool });
            this.props.annotationManager.startAnnotationMode(tool, { defaultColor: this.state.color });
        }
    };

    onColorChange = () => {
        const color = this.colorRef.current.value;
        this.setState({ color });
        if (this.state.selectedTool) {
            this.props.annotationManager.startAnnotationMode(this.state.selectedTool, { defaultColor: this.state.color } );
        }
    };

    onExpandClick = page => {
        if (page !== this.state.page) {
            this.setState({ page });
            this.apis.gotoLocation(page);
        } else {
            this.setState({ page: 0 });
        }
    };

    render() {
        const disabled = !this.props.annotationManager;
        const page1Comms = this.state.annotationListItems.filter(annot => (annot.target.selector.node.index === 0));
        const page2Comms = this.state.annotationListItems.filter(annot => (annot.target.selector.node.index === 1));
        const page3Comms = this.state.annotationListItems.filter(annot => (annot.target.selector.node.index === 2));
        const page4Comms = this.state.annotationListItems.filter(annot => (annot.target.selector.node.index === 3));
        const page5Comms = this.state.annotationListItems.filter(annot => (annot.target.selector.node.index === 4));
        return (
            <div className="annotations-container">
                <IconButton onClick={ this.props.handleDrawerClose } className="back">
                    <ChevronRightIcon fontSize="large" />
                </IconButton>
                <div className="annotation-header">
                    <IconButton disabled={ disabled } className="tools" onClick={ e => this.onToolsClick("note")}>
                        <CommentIcon fontSize="small" color={ this.state.selectedTool === "note" ? "primary" : "inherit" } />
                    </IconButton>
                    <IconButton disabled={ disabled } className="tools" onClick={ e => this.onToolsClick("strikeout")}>
                        <FormatStrikethroughIcon fontSize="small" color={ this.state.selectedTool === "strikeout" ? "primary" : "inherit" } />
                    </IconButton>
                    <IconButton disabled={ disabled } className="tools" style={ this.state.selectedTool === "highlight" ? { color: "#1976d2" } : {}} onClick={ e => this.onToolsClick("highlight")}>
                        <FaHighlighter size={17} />
                    </IconButton>
                    <IconButton disabled={ disabled } className="tools" onClick={ e => this.onToolsClick("underline")}>
                        <FormatUnderlinedIcon fontSize="small" color={ this.state.selectedTool === "underline" ? "primary" : "inherit" } />
                    </IconButton>
                    <IconButton disabled={ disabled } className="tools" onClick={ e => this.onToolsClick("shape")}>
                        <BrushIcon fontSize="small" color={ this.state.selectedTool === "shape" ? "primary" : "inherit" } />
                    </IconButton>
                    <IconButton disabled={ disabled } className="tools">
                        <input
                            ref={ this.colorRef }
                            type="color"
                            id="color"
                            value={ this.state.color || "#fccb00" }
                            onChange={ this.onColorChange.bind(this) }
                            onKeyUp={ this.onColorChange.bind(this) }
                        />
                    </IconButton>
                </div>
                <Divider/>
                {
                    !disabled && <React.Fragment>
                        <ExpansionPanel onClick={ () => this.onExpandClick(1) } expanded={ this.state.page === 1 }>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Page 1 Comments</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {
                                    page1Comms.length > 0 ? <ul id="annotations">
                                        {
                                            page1Comms
                                                .map(listItem =>
                                                    <ListItem
                                                        key={listItem.id}
                                                        annotation={listItem}
                                                        selectedAnnotationId={this.state.selectedAnnotationId}
                                                        annotationManager={this.props.annotationManager}
                                                    />
                                                )
                                        }
                                    </ul> : <Typography>No comments yet</Typography>
                                }
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel onClick={ () => this.onExpandClick(2) } expanded={ this.state.page === 2 }>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Page 2 Comments</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {
                                    page2Comms.length > 0 ? <ul id="annotations">
                                        {
                                            page2Comms
                                                .map(listItem =>
                                                    <ListItem
                                                        key={listItem.id}
                                                        annotation={listItem}
                                                        selectedAnnotationId={this.state.selectedAnnotationId}
                                                        annotationManager={this.props.annotationManager}
                                                    />
                                                )
                                        }
                                    </ul> : <Typography>No comments yet</Typography>
                                }
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel onClick={ () => this.onExpandClick(3) } expanded={ this.state.page === 3 }>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Page 3 Comments</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {
                                    page3Comms.length > 0 ? <ul id="annotations">
                                        {
                                            page3Comms
                                                .map(listItem =>
                                                    <ListItem
                                                        key={listItem.id}
                                                        annotation={listItem}
                                                        selectedAnnotationId={this.state.selectedAnnotationId}
                                                        annotationManager={this.props.annotationManager}
                                                    />
                                                )
                                        }
                                    </ul> : <Typography>No comments yet</Typography>
                                }
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel onClick={ () => this.onExpandClick(4) } expanded={ this.state.page === 4 }>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Page 4 Comments</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {
                                    page4Comms.length > 0 ? <ul id="annotations">
                                        {
                                            page4Comms
                                                .map(listItem =>
                                                    <ListItem
                                                        key={listItem.id}
                                                        annotation={listItem}
                                                        selectedAnnotationId={this.state.selectedAnnotationId}
                                                        annotationManager={this.props.annotationManager}
                                                    />
                                                )
                                        }
                                    </ul> : <Typography>No comments yet</Typography>
                                }
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        <ExpansionPanel onClick={ () => this.onExpandClick(5) } expanded={ this.state.page === 5 }>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>Page 5 Comments</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {
                                    page5Comms.length > 0 ? <ul id="annotations">
                                        {
                                            page5Comms
                                                .map(listItem =>
                                                    <ListItem
                                                        key={listItem.id}
                                                        annotation={listItem}
                                                        selectedAnnotationId={this.state.selectedAnnotationId}
                                                        annotationManager={this.props.annotationManager}
                                                    />
                                                )
                                        }
                                    </ul> : <Typography>No comments yet</Typography>
                                }
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </React.Fragment>
                }
                <div className="footer">
                    <Button
                        variant="contained"
                        color={ (disabled || this.state.imported) ? "secondary" : "primary" }
                        startIcon={ this.state.importing ? <CachedIcon/> : <AiOutlineImport /> }
                        size="small"
                        disabled={ disabled || this.state.imported }
                        onClick={ () => {
                            this.setState({ importing: true });
                            getAnnotations()
                                .then(annots => {
                                    if (annots) {
                                        this.props.annotationManager.addAnnotations(annots)
                                            .then(() => {
                                                this.setState({ imported: true, importing: false });
                                            });
                                    } else {
                                        this.setState({ imported: true, importing: false });
                                    }
                                });
                        }}
                    >
                        {  this.state.importing ? "Fetching Comments" : "Import Comments" }
                    </Button>
                    <Button
                        variant="contained"
                        color={ (disabled || this.state.exporting) ? "secondary" : "primary" }
                        size="small"
                        startIcon={ this.state.exporting ? <CachedIcon/> :  <TiExport />}
                        disabled={ disabled || this.state.exporting }
                        onClick={ () => {
                            this.setState({ exporting: true });
                            this.props.annotationManager.getAnnotations()
                                .then(annots => {
                                    updateAnnotations(annots).then(() => {
                                        this.setState({ exporting: false });
                                    })
                                });
                        }}
                    >
                        {  this.state.exporting ? "Saving Comments" : "Export Comments" }
                    </Button>
                </div>
            </div>
        );
    }
}

export default CustomRHP;
