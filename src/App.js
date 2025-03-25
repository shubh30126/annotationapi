import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import {
  Drawer,
  CssBaseline,
  IconButton,
  Paper,
  Tooltip
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  NavigateNext as NextMatchIcon,
  NavigateBefore as PrevMatchIcon,
  Close as ClearSearchIcon
} from '@material-ui/icons';
import ViewSDKClient from "./ViewSDKClient";
import CustomRHP from "./CustomRHP";
import './App.css';

const drawerWidth = 350;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  controls: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    zIndex: 1,
    position: 'relative',
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: '100%',
    '&.shifted': {
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    minHeight: 48,
    '&.search-group': {
      position: 'absolute',
      right: theme.spacing(3),
      maxWidth: 450,
      minWidth: 200,
    }
  },
  pageInfo: {
    padding: theme.spacing(1, 2),
    minWidth: 80,
    textAlign: 'center',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  searchInput: {
    padding: theme.spacing(1),
    paddingRight: theme.spacing(20),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    width: '100%',
    fontSize: '0.875rem',
  },
  searchResults: {
    position: 'absolute',
    right: theme.spacing(12),
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    backgroundColor: 'transparent',
    padding: theme.spacing(0, 1),
    zIndex: 1,
  },
  searchControls: {
    position: 'absolute',
    right: theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  pdfContainer: {
    flexGrow: 1,
    backgroundColor: theme.palette.grey[100],
  },
  iconButton: {
    color: theme.palette.primary.main,
    '&:disabled': {
      color: theme.palette.action.disabled,
    },
  },
  menu: {
    position: 'absolute',
    top: '48%',
    right: '0',
    marginRight: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    '&:hover': {
      backgroundColor: '#f0f2f5',
    },
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
    border: 'none',
    borderLeft: '1px solid #d1d7db',
  },
  showPanelButton: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '4px 0 0 4px',
    boxShadow: theme.shadows[2],
    zIndex: 1,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  content: {
    position: 'relative',
    display: 'flex',
    flexGrow: 1,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: -drawerWidth,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'white',
  },
  contentShift: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
    width: `calc(100% - ${drawerWidth}px)`,
  },
  pdfViewer: {
    flex: '1 1',
    display: 'flex',
    overflow: 'hidden',
    margin: '50px 80px',
    border: '14px solid black',
    backgroundColor: 'white',
    padding: 0,
    '& > div': {
      flex: 1,
      width: '100% !important',
      height: '100% !important',
    },
  },
}));

function App() {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);
  const [annotationManager, setAnnotationManager] = React.useState(null);
  const [viewSDKClient, setViewSDKClient] = React.useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchObject, setSearchObject] = useState(null);
  const [searchResults, setSearchResults] = useState({
    totalMatches: 0,
    currentMatch: 0,
    noResults: false,
    lastSearchText: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchState, setSearchState] = useState(null);
  const [searchInProgress, setSearchInProgress] = useState(false);

  React.useEffect(() => {
    const viewSDKClientInstance = new ViewSDKClient();
    viewSDKClientInstance.ready().then(() => {
      viewSDKClientInstance.previewFile("pdf-div", {
        showRHP: false,
        enableModernViewer: true,
        enableAnnotationAPIs: true,
        onPagesInfoUpdate: (current, total) => {
          setCurrentPage(current);
          setTotalPages(total);
        },
        annotationUIConfig: {
          showToolbar: false,
          showCommentsPanel: false,
          downloadWithAnnotations: true,
          printWithAnnotations: true,
        }
      }).then(() => {
        const checkAndSetState = () => {
          if (viewSDKClientInstance.isReady()) {
            setViewSDKClient(viewSDKClientInstance);
            setAnnotationManager(viewSDKClientInstance.getAnnotationManager());
          } else {
            setTimeout(checkAndSetState, 100);
          }
        };
        checkAndSetState();
      });
    });
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleZoomIn = () => {
    viewSDKClient?.zoomIn();
  };

  const handleZoomOut = () => {
    viewSDKClient?.zoomOut();
  };

  const handlePreviousPage = async () => {
    if (viewSDKClient) {
      const newPage = await viewSDKClient.previousPage();
      setCurrentPage(newPage);
    }
  };

  const handleNextPage = async () => {
    if (viewSDKClient) {
      const newPage = await viewSDKClient.nextPage();
      setCurrentPage(newPage);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchText.trim()) return;

    if (searchText === searchResults.lastSearchText && searchResults.totalMatches > 0) {
        handleNextMatch();
        return;
    }

    setIsSearching(true);

    try {
        if (searchObject) {
            await viewSDKClient?.clearSearch(searchObject);
            setSearchObject(null);
            setSearchResults({
                totalMatches: 0,
                currentMatch: 0,
                noResults: false,
                lastSearchText: searchText
            });
        }

        const result = await viewSDKClient?.search(searchText);
        if (result) {
            const { searchObject: newSearchObject, ...searchData } = result;
            setSearchObject(newSearchObject);
            setSearchResults({
                ...searchData,
                lastSearchText: searchText
            });

            newSearchObject.onResultsUpdate((state) => {
                console.log('Search Update:', state);
                if (state.currentResult) {
                    setSearchResults(prev => ({
                        ...prev,
                        totalMatches: state.totalResults || 0,
                        currentMatch: state.currentResult.index,
                        pageNumber: state.currentResult.pageNumber,
                        lastSearchText: searchText
                    }));
                }
            });
        } else {
            setSearchResults({ 
                totalMatches: 0, 
                currentMatch: 0,
                noResults: true,
                lastSearchText: searchText
            });
        }
    } catch (error) {
        console.error('Search error:', error);
    } finally {
        setIsSearching(false);
    }
  };

  const handleNextMatch = async () => {
    if (!searchObject) return;
    await viewSDKClient?.nextMatch(searchObject);
  };

  const handlePrevMatch = async () => {
    if (!searchObject) return;
    await viewSDKClient?.previousMatch(searchObject);
  };

  const handleClearSearch = async () => {
    if (searchObject) {
      await viewSDKClient?.clearSearch(searchObject);
      setSearchObject(null);
      setSearchResults({ 
          totalMatches: 0, 
          currentMatch: 0, 
          noResults: false,
          lastSearchText: '' 
      });
      setSearchText('');
    }
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      
      <Paper className={clsx(classes.controls, { shifted: open })} elevation={1}>
        <div className={classes.controlGroup}>
          <Tooltip title="Zoom Out">
            <IconButton 
              className={classes.iconButton}
              onClick={handleZoomOut}
              size="small"
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom In">
            <IconButton 
              className={classes.iconButton}
              onClick={handleZoomIn}
              size="small"
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
        </div>

        <div className={classes.controlGroup}>
          <Tooltip title="Previous Page">
            <IconButton 
              className={classes.iconButton}
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              size="small"
            >
              <PrevIcon />
            </IconButton>
          </Tooltip>
          
          <div className={classes.pageInfo}>
            {currentPage} / {totalPages}
          </div>
          
          <Tooltip title="Next Page">
            <IconButton 
              className={classes.iconButton}
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              size="small"
            >
              <NextIcon />
            </IconButton>
          </Tooltip>
        </div>

        <div className={clsx(classes.controlGroup, 'search-group')}>
          <form onSubmit={handleSearch} className={classes.searchContainer}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              placeholder="Search..."
              className={classes.searchInput}
            />
            {(searchResults.totalMatches > 0 || searchResults.noResults) && (
              <div className={classes.searchResults}>
                {searchResults.totalMatches > 0 ? (
                  `${searchResults.currentMatch} of ${searchResults.totalMatches}`
                ) : (
                  <span style={{ color: theme.palette.error.main }}>
                    No results
                  </span>
                )}
              </div>
            )}
            <div className={classes.searchControls}>
              {searchResults.totalMatches > 0 && (
                <>
                  <Tooltip title="Previous match">
                    <span>
                      <IconButton
                        className={classes.iconButton}
                        onClick={handlePrevMatch}
                        size="small"
                        disabled={searchResults.currentMatch <= 1}
                      >
                        <PrevMatchIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Next match">
                    <span>
                      <IconButton
                        className={classes.iconButton}
                        onClick={handleNextMatch}
                        size="small"
                        disabled={searchResults.currentMatch >= searchResults.totalMatches}
                      >
                        <NextMatchIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
              <Tooltip title={searchText ? "Clear search" : "Search"}>
                <IconButton
                  className={classes.iconButton}
                  type={searchText ? "button" : "submit"}
                  onClick={searchText ? handleClearSearch : undefined}
                  size="small"
                  disabled={isSearching}
                >
                  {searchText ? <ClearSearchIcon /> : <SearchIcon />}
                </IconButton>
              </Tooltip>
            </div>
          </form>
        </div>
      </Paper>

      <main className={clsx(classes.content, {
        [classes.contentShift]: open,
      })}>
        <div id="pdf-div" className={classes.pdfViewer} />
        
        {!open && (
          <Tooltip title="Show comments panel">
            <IconButton
              className={classes.showPanelButton}
              onClick={handleDrawerOpen}
              size="small"
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        )}
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
          annotationManager={annotationManager}
          handleDrawerClose={handleDrawerClose}
          viewSDKClient={viewSDKClient}
        />
      </Drawer>
    </div>
  );
}

export default App;
