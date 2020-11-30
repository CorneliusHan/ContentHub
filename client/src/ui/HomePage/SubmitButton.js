import React, { useEffect } from "react";
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import purple from '@material-ui/core/colors/purple';
import green from '@material-ui/core/colors/green';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import server from '../../config/server';
import errorUtil from "../../ErrorUtil";



const useStyles = makeStyles(theme => ({
    root: {
        marginLeft: "10%"
    },
    palette: {
        primary: purple,
        secondary: green,
    },
    submitButton: {
        marginRight: theme.spacing(2),
        marginTop: '6%',
        marginLeft: '14%'
    },
    title: {
        color: 'white',
        fontSize: '20px'
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 7),
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: 200,
        },
    },
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'flex',
        },
    },
    formControl: {
        margin: theme.spacing(3),
        width: '30%'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

export default function SubmitButton(props) {
    const classes = useStyles();
    const [titleT, setTitle] = React.useState('');
    const [urlU, setUrl] = React.useState('');
    const [company, setCompany] = React.useState("");
    const [companies, setCompanies] = React.useState([]);
    const [companyID, setCompanyID] = React.useState(null);
    const [category, setCategory] = React.useState("");
    const [categories, setCategories] = React.useState([]);
    const [categoryID, setCategoryID] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [post, setPost] = React.useState(false);


    const handleClickOpen = () => {
        // handle http request to get a list of company.category and update it to tcompanies state here
        setOpen(true);
    };

    const handleClose = () => {
        setUrl('');
        setTitle('');
        setCompanyID(null);
        setCategoryID(null);
        setPost(false);
        setOpen(false);
    };

    const handleSubmit = async () => {
        try {
            const url = new URL(`${server}/post`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: titleT,
                    url: urlU,
                    companyId: companyID,
                    categoryId: categoryID,
                    userId: (props.userId).toString(),
                    isStream: JSON.parse(post)
                }),
            });
            await errorUtil.handleErrors(response);
            alert('Posted successfully!');
            setUrl('');
            setTitle('');
            setCompanyID(null);
            setCategoryID(null);
            setCompany(null);
            setCategory(null);
            setPost(false);
            setOpen(false);
        } catch (error) {
            alert(error);
        }
    };

    const handleCompany = (event) => {
        setCompany(event.target.value);
        setCompanyID(event.target.value);
    }

    const handleURL = (event) => {
        setUrl(event.target.value);
    }

    const handleTitle = (event) => {
        setTitle(event.target.value);
    }

    const handleType = event => {
        setPost(event.target.value);
    };

    const handleCategory = event => {
        setCategory(event.target.value);
        setCategoryID(event.target.value);
    };

    useEffect(() => {
        const getCategories = async () => {
            try {
                const url = new URL(`${server}/category`);

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });
                const result = await errorUtil.handleErrors(response).json();
                setCategories(result.categories);
                console.log(result.categories);
            } catch (error) {
                alert(error);
            }
        };
        const getCompanies = async () => {
            try {
                const url = new URL(`${server}/company`);

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });


                const result = await errorUtil.handleErrors(response).json();
                setCompanies(result.companies);
                console.log(result.companies);
            } catch (error) {
                alert(error);
            }
        };
        try {
            getCategories();
            getCompanies();
        } catch (error) {

        }
    }, []);


    return (
        <div>
            <Fab variant="extended" color="inherit" aria-label="account of current user" className={classes.submitButton} onClick={handleClickOpen}>
                <AddIcon />
            New Post
            </Fab>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Submit a New Post</DialogTitle>
                <DialogContent>
                    <TextField
                        required
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Title"
                        type="title"
                        fullWidth
                        onChange={handleTitle}
                    />
                    <TextField
                        required
                        autoFocus
                        margin="dense"
                        id="name"
                        label="URL"
                        type="URL"
                        fullWidth
                        onChange={handleURL}
                    />
                    <FormControl className={classes.formControl}>
                        <InputLabel id="demo-simple-select-label">Company</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={company}
                            onChange={handleCompany}
                        >
                            <MenuItem value={null}>None</MenuItem>
                            {companies.map((c) =>
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="demo-simple-select-label">Category</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={category}
                            onChange={handleCategory}
                        >
                            <MenuItem value={null}>None</MenuItem>
                            {categories.map((c) =>
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <RadioGroup aria-label="Type" name="type" value={post} onChange={handleType}>
                        <FormControlLabel value={false} control={<Radio />} label="Post" />
                        <FormControlLabel value={true} control={<Radio />} label="Blog Stream" />
                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                </Button>
                    <Button onClick={handleSubmit} color="primary">
                        Post
                </Button>
                </DialogActions>
            </Dialog>
        </div>)
}

