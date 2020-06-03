import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ViewSDKClient from "./ViewSDKClient";
import CustomRHP from "./CustomRHP";

const drawerWidth = 350;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        height: '100%',
    },
    menu: {
        position: 'absolute',
        top: '48%',
        right: '0',
        'margin-right': '20px',
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    content: {
        flexGrow: 1,
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginRight: -drawerWidth,
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginRight: 0,
    },
}));

export default function PersistentDrawerRight() {
    const classes = useStyles();
    const [open, setOpen] = React.useState(true);
    const [annotationManager, setAnnotationManager] = React.useState();
    const [viewSDKClient, setViewSDKClient] = React.useState();

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    React.useEffect(() => {
        const viewSDKClientL = new ViewSDKClient();
        viewSDKClientL.ready().then(() => {
            /* Invoke the file preview and get the Promise object */
            viewSDKClientL.previewFile("pdf-div", {
                /* Enable commenting APIs */
                enableAnnotationAPIs: true,  /* Default value is false */
                annotationUIConfig: {
                    showToolbar: false,   /* Default value is true */
                    showCommentsPanel: false,  /* Default value is true */
                    downloadWithAnnotations: true,  /* Default value is false */
                    printWithAnnotations: true,  /* Default value is false */
                },
            }).then(adobeViewer => {
                window.adobeViewer = adobeViewer;
                adobeViewer.getAnnotationManager().then(annotManager => {
                    setAnnotationManager(annotManager);
                    window.annotationManager = annotationManager;
                    setViewSDKClient(viewSDKClientL);
                });
            });
        });
    }, []);

    return (
        <div className={classes.root}>
            <CssBaseline />
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerOpen}
                className={clsx(open && classes.hide, classes.menu)}
            >
                <MenuIcon />
            </IconButton>
            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: open,
                })}
            >
                <div id="pdf-div" className="pdf-view" />
            </main>
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="right"
                open={open}
                classes={{
                    paper: classes.drawerPaper,
                }}
            >
                <CustomRHP
                    annotationManager={ annotationManager }
                    handleDrawerClose={ handleDrawerClose }
                    viewSDKClient={ viewSDKClient }
                />
            </Drawer>
        </div>
    );
}
