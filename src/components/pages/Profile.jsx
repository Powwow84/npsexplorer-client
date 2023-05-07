import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ExperienceView from "./ExperienceView";
import profile from "../../styles/profile.css"

// imported the default widget that they give you on page
import 'uploadcare-widget/uploadcare.lang.en.min.js';
import uploadcare from 'uploadcare-widget';

export default function Profile({ currentUser, handleLogout }) {
    const [experiencesList, setExperiencesList] = useState([]);
    const [showExperience, setShowExperience] = useState(false);
    const [experienceView, setExperiencesView] = useState({});
    const [header, setHeader] = useState(true);
    const [userImage, setUserImage] = useState(require("../../media/defaultAvatar.png")) // IMPORT AVATAR FROM SRC/MEDIA dir
    const navigate = useNavigate()

    // If has an existing profile image, load it 
    useEffect(
        async () => {
            const token = localStorage.getItem('jwt')
            const options = {
                headers: {
                    'Authorization': token
                }
            }
            const userPhoto = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api-v1/users/auth-locked`, options)
            if (userPhoto.data.msg) {
                setUserImage(userPhoto.data.msg)
            }
        }, []);

    // edited the upload care function to be a named function and binds it to the event listener, so when the file is uploaded the event is triggered and the file is passed.  The fileInfo.cdnUrl contains the uploaded file's URL. and the image is set to the state
    const initUploadcareWidget = () => {
        const widget = uploadcare.SingleWidget('#uploadcare-uploader');
        widget.onUploadComplete(async (fileInfo) => {
            console.log('File uploaded:', fileInfo.cdnUrl);
            const userPhoto = {
                image: fileInfo.cdnUrl
            }
            const token = localStorage.getItem('jwt')
            const options = {
                headers: {
                    'Authorization': token
                }
            }
            const updateUserPhoto = await axios.put(`${process.env.REACT_APP_SERVER_URL}/api-v1/users/auth-locked`, userPhoto, options)
            const updatedUserPhoto = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api-v1/users/auth-locked`, options)
            setUserImage(updatedUserPhoto.data.msg);
        });
    };

    const handleClick = experience => {
        setExperiencesView(experience)
        setShowExperience(true)
    }

    const handleDeleteClick = async (experience) => {
        console.log(experience)
        console.log("delete button clicked")
        try {
            const token = localStorage.getItem('jwt')
            const options = {
                headers: {
                    'Authorization': token
                }
            }
            const deleteExperience = await axios.delete(`${process.env.REACT_APP_SERVER_URL}/api-v1/experiences/${experience._id}`, options);

            const updatedExperiences = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api-v1/experiences/${currentUser._id}`, options)
            console.log("found exps: ", updatedExperiences.data.length)
            setExperiencesList(updatedExperiences)
            if (updatedExperiences.data.length === 0) {
                setHeader(true)
            }
            setShowExperience(false)
        } catch (err) {
            console.warn(err)
            if (err.response) {
                if (err.response.status === 401) {
                    handleLogout()
                    navigate('/users/login')
                }
            }
        }
    }

    useEffect(() => {
        // this mounts the widget and waits for a timeout incase it doesnt load on mount
        setTimeout(() => {
            initUploadcareWidget();
        }, 0);
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('jwt')
                const options = {
                    headers: {
                        'Authorization': token
                    }
                }
                const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api-v1/users/auth-locked`, options)

                const findExperiences = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api-v1/experiences/${currentUser._id}`, options)
                if (findExperiences.data.length > 0) {
                    setHeader(false)
                }
                setExperiencesList(findExperiences)
            } catch (err) {
                console.warn(err)
                if (err.response) {
                    if (err.response.status === 401) {
                        handleLogout()
                        navigate('/users/login')
                    }
                }
            }
        }
        fetchData()
    }, [handleLogout, navigate])

    const experiencesExistHeader = (
        <div className='experienceHeader'>
            <h2 className='leftAligin experienceHeaderText noMargin'>Past adventures</h2>
        </div>
    )
    const experiencesDontExistHeader = (
        <div className='experienceHeader'>
            <h2 className='leftAligin experienceHeaderText noMargin'>Go visit some national parks and journal your experiences!</h2>
        </div>
    )
    const experiences = experiencesList.data?.map((experience, i) => {
        return (
            <div onClick={() => handleClick(experience)} key={`experience-${i}`}
            className='experienceCard'>
                <div className='experienceImgContainer'>
                <img className='experienceImg' src={experience.image}/>
                </div>
                <p className='experienceText noMargin'>{experience.location}</p>
            </div>
        )
    })


    const profileView = (
        <div className='profileView'>
            <div onClick={() => handleLogout()} className='logoutContainer'>
                <p className='logoutText'>Logout</p>
                <img src={require("../../media/logout.png")}
                    className='logoutImg'></img>
            </div>
            <div className='profileHeader'>
                <div className='profileHeaderLeft'>
                    <img src={userImage}
                        style={{
                            height: "100px",
                            borderRadius: "50%"
                        }}

                    ></img>
                    <h1 className='profileName'>{currentUser?.name}</h1>
                </div>
                <div className='profileHeaderRight'>
                    <h3 className='noMargin leftAligin'>3</h3>
                    <p className='noMargin'>Destinations</p>
                    <hr className='lineBreak'></hr>
                    <h3 className='noMargin leftAligin'>5</h3>
                    <p className='noMargin'>Experiences</p>
                </div>
            </div>
            <div>
                {header ? experiencesDontExistHeader : experiencesExistHeader}
                {experiences}
            </div>
        </div>
    )

    const showExperienceView = (
        <ExperienceView
            experienceView={experienceView}
            setShowExperience={setShowExperience}
            setExperiencesView={setExperiencesView}
            currentUser={currentUser}
            handleDeleteClick={handleDeleteClick}
            setExperiencesList={setExperiencesList}
        />
    )

    return (
        <div>
            {showExperience ? showExperienceView : profileView}
            <input
                id="uploadcare-uploader"
                type="hidden"
                role="uploadcare-uploader"
                data-public-key="e667ec242e718125294d"
                data-tabs="file facebook gphotos instagram"
            />
        </div>
    )
}