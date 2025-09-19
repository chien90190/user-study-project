function prevPage() {
    // Add functionality for previous page
    console.log('Previous page');
    changePage(now)
    now -= 1;
    renderObjects(now);
    resetRadioStatus(now);
}

function nextPage() {
    console.log('Next page');
    if (changePage(now)) {
        if(now === data_list.length-1) {
            MySubmit = form_url;
            MySubmit += `${username_entry}=` + data_list[0]["username"] + "&";
            
            let entryIndex = 0;
            
            // Handle all data starting from index 2
            for(let i=2; i<data_list.length; i++) {
                if (data_list[i].type === "stillness") {
                    // This will now submit "input" or "ours" instead of 1-5
                    MySubmit += entry_list[entryIndex][0] + "=" + data_list[i][`S1`] + "&";
                } else {
                    // Handle comparison questions (Q1-Q3)  
                    for(let q = 1; q <= num_of_questions; q++) {
                        MySubmit += entry_list[entryIndex][q-1] + "=" + data_list[i][`Q${q}`] + "&";
                    }
                }
                entryIndex++;
            }

            MySubmit += "submit=Submit";
            window.location.replace(MySubmit);
        } else {
            // MISSING: Move to next page
            now += 1;
            renderObjects(now);
            resetRadioStatus(now);
        }
                
    } else {
        alert("Cannot be empty!!!!");
    }
}

function changePage(now) {
    console.log("changePage called with now =", now);
    
    if (now == 0) {
        // Username validation
        console.log("Validating username page");
        username = document.getElementById("username");
        if (username.value == "") {
            console.log("Username is empty");
            return false;
        }
        data_list[0]['username'] = username.value;
        console.log("Username saved:", data_list[0]['username']);
        return true;
    } else if (now == 1) {
        // Instruction page - no validation needed, just return true
        console.log("Instruction page - returning true");
        return true;
    } else {
        // Question validation for video pages
        console.log("Validating video page");
        let query_checked = true;
        let videoDataIndex = now;
        
        // Safety check
        if (!data_list[videoDataIndex]) {
            console.log("No data found for index", videoDataIndex);
            return false;
        }
        
        let isStillness = data_list[videoDataIndex].type === "stillness";
        console.log("Is stillness page:", isStillness);

        // In changePage function:
        if (isStillness) {
            let query = document.querySelector(`input[name="S1"]:checked`);
            if (query == null) {
                query_checked = false;
            } else {
                // This line correctly converts 1→"input" or 2→"ours" 
                data_list[videoDataIndex][`S1`] = data_list[videoDataIndex]['data'][parseInt(query.value)-1]['value'];
            }
        } else {
            // Validate comparison questions (Q1-Q3)
            for(let q = 1; q <= num_of_questions; q++) {
                let query = document.querySelector(`input[name="Q${q}"]:checked`);
                if (query == null) {
                    query_checked = false;
                    console.log("Missing answer for Q" + q);
                } else {
                    data_list[videoDataIndex][`Q${q}`] = data_list[videoDataIndex]['data'][parseInt(query.value)-1]['value'] 
                }
            }
        }

        console.log("Query checked result:", query_checked);
        return query_checked;
    }
}

function resetRadioStatus(now) {
    if (now <= 1) return;
    
    let videoDataIndex = now; 
    let isStillness = data_list[videoDataIndex].type === "stillness";
    
    if (isStillness) {
        // Reset radio buttons
        for(let v = 1; v <= 2; v++) {
            document.getElementById(`s1v${v}`).checked = false;
        }
        
        // Set previously selected value
        for(let v = 1; v <= 2; v++) {
            if(data_list[videoDataIndex][`S1`] === data_list[videoDataIndex]['data'][v-1]['value']) {
                document.getElementById(`s1v${v}`).checked = true;
                break;
            }
        }
    } else {
        // Original comparison radio reset logic
        for(let q = 1; q <= num_of_questions; q++) {
            for(let v = 1; v <= num_of_selection; v++) {
                document.getElementById(`q${q}v${v}`).checked = false;
            }

            for(let v = 1; v <= num_of_selection; v++) {
                if(data_list[videoDataIndex][`Q${q}`] === data_list[videoDataIndex]['data'][v-1]['value']) {
                    document.getElementById(`q${q}v${v}`).checked = true;
                    break;
                }
            }
        }
    }
}

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function generateElements(data, width, type) {
    if(type === "video") {
        const uniqueId = 'video_' + Math.random().toString(36).substr(2, 9);
        return `
            <video id="${uniqueId}" class="sync-video" width="${width}" controls preload="auto" muted
            onplay="syncOtherVideos(this)" 
            onseeked="syncOtherVideoTime(this)"
            onloadedmetadata="console.log('Video metadata loaded', this.id)">
                <source src="${data}" type="video/mp4" />
            </video>
        `;
    }
    else if(type === "image") {
        return `
            <img src="${data}" width="${width}"/>
        `;
    }
}

// Functions to control videos
function getAllVideos() {
    return document.querySelectorAll('video');
}

function playAllVideos() {
    const videos = getAllVideos();
    videos.forEach(video => {
        // Check if video is ready to play
        if (video.readyState >= 2) { 
            video.play().catch(err => {
                console.error('Error playing video:', err);
            });
        } else {
            // If not ready, wait for it to be ready
            video.addEventListener('canplay', function playOnceReady() {
                video.play().catch(err => {
                    console.error('Error playing video:', err);
                });
                video.removeEventListener('canplay', playOnceReady);
            });
        }
    });
}

function pauseAllVideos() {
    const videos = getAllVideos();
    videos.forEach(video => {
        video.pause();
    });
}

function jumpToTime(percentage) {
    const videos = getAllVideos();
    
    // Disable event listeners temporarily to prevent feedback loops
    videos.forEach(video => {
        video.onpause = null;
        video.onseeked = null;
        video.onplay = null;
    });
    
    // Set all videos to the same time point
    videos.forEach(video => {
        // Only set time if duration is available
        if (video.readyState >= 1 && !isNaN(video.duration)) {
            const targetTime = video.duration * percentage;
            video.currentTime = targetTime;
            video.pause();
        } else {
            // If duration not available, wait for metadata
            video.addEventListener('loadedmetadata', function setTimeOnceReady() {
                const targetTime = video.duration * percentage;
                video.currentTime = targetTime;
                video.pause();
                video.removeEventListener('loadedmetadata', setTimeOnceReady);
            });
        }
    });
    
    // Re-enable synchronization after a short delay
    setTimeout(() => {
        initVideoSynchronization();
    }, 500);
}

// Add these functions to sync videos
function syncOtherVideos(currentVideo) {
    // Get all videos except the current one
    const videos = Array.from(getAllVideos()).filter(v => v !== currentVideo);
    
    // Only try to sync if the current video is the one that initiated the action
    if (document.activeElement === currentVideo) {
        videos.forEach(video => {
            if (video.paused) {
                video.currentTime = currentVideo.currentTime;
                // Use a flag to prevent infinite loops of event handlers
                video._ignoreNextPlay = true;
                video.play().catch(() => {});
            }
        });
    }
}

function syncOtherVideoTime(currentVideo) {
    // Get all videos except the current one
    const videos = Array.from(getAllVideos()).filter(v => v !== currentVideo);
    
    // Only try to sync if the current video is the one that initiated the action
    if (document.activeElement === currentVideo) {
        videos.forEach(video => {
            // Use a flag to prevent infinite loops
            if (!video._ignoreNextSeek) {
                video._ignoreNextSeek = true;
                video.currentTime = currentVideo.currentTime;
                // Reset the flag after a short delay
                setTimeout(() => { video._ignoreNextSeek = false; }, 100);
            }
        });
    }
}

// Add this function to your JavaScript and call it at the appropriate time
function initVideoSynchronization() {
    console.log('Initializing video synchronization');
    const videos = getAllVideos();
    
    // Remove existing event listeners to prevent duplication
    videos.forEach(video => {
        video.onplay = null;
        video.onseeked = null;
        video.onpause = null;
    });
    
    // Add fresh event listeners
    videos.forEach(video => {
        video.addEventListener('play', function() {
            if (!this._ignoreNextPlay) {
                syncOtherVideos(this);
            }
            this._ignoreNextPlay = false;
        });
        
        video.addEventListener('seeked', function() {
            if (!this._ignoreNextSeek) {
                syncOtherVideoTime(this);
            }
        });
    });
}


function renderObjects(now) {
    if(now == 0) {
        // Username page
        let txt = `
            <br><br><br><br><br><br>
            <h1>User Study</h1>
            <form style="text-align: center;" align="center">
                <fieldset>
                    <legend>Put Anonymous Username</legend>
                    <input type="text" id="username" value="">
                </fieldset>
            </form>
        `;
        document.getElementById("images").innerHTML = txt;
        document.getElementById("num_page").innerHTML = ``;
    } else if(now == 1) {
        // Instruction page
        let txt = `
            <div style="text-align: center; padding: 20px;">
                <h2>Instructions</h2>
                <div style="max-width: 800px; margin-left: auto; margin-right: auto; text-align: left;">
                    <p style="margin-bottom: 10px; font-size: 16px;">
                        This study evaluates different video processing methods for mannequin challenge videos, where people freeze like mannequins while a camera moves around the scene.
                    </p>
                    <p style="margin-bottom: 20px; font-size: 16px; text-align: left;">
                        Below is an example of what mannequin challenge is.
                    </p>
                </div>
                
                <!-- Your instruction video -->
                <video width="800" controls preload="auto" autoplay muted loop>
                    <source src="./data/instruction-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                
                <div style="margin-top: 20px; text-align: left; max-width: 800px; margin-left: auto; margin-right: auto;">
                    <h3>What you'll be evaluating:</h3>
                    <ul>
                        <li><strong>Artifacts:</strong> Look for ghosting or double contour effects around humans</li>
                        <li><strong>Frozen Time Effect:</strong> Evaluate how convincing and appealing the video is</li>
                    </ul>
                    
                    <p><strong>Instructions:</strong></p>
                    <p>There are ${num_comparison_pages + num_stillness_pages} questions. In the first part (${num_comparison_pages} questions), for each set of videos, you'll answer questions by selecting which video performs best for each criterion. In the second part (${num_stillness_pages} questions), you'll compare two videos and select which one is closer to the ideal of stillness in Mannequin Challenge. Take your time to compare all videos before making your selections.</p>
                </div>
            </div>
        `;
        document.getElementById("images").innerHTML = txt;
        document.getElementById("num_page").innerHTML = ``;
    } else {
        // Video pages (both comparison and stillness)
        let videoDataIndex = now; // Don't subtract 1, use now directly since video data starts at index 2
        let isStillness = data_list[videoDataIndex].type === "stillness";
        
        // Control buttons (same for both types)
        let controlButtons = `
            <div class="group-controls" style="display: flex; justify-content: center; margin-bottom: 15px; gap: 10px;">
                <button class="btn" onclick="playAllVideos()" style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 3px;">Start All</button>
                <button class="btn" onclick="pauseAllVideos()" style="padding: 5px 10px; background-color: #6c757d; color: white; border: none; border-radius: 3px;">Stop All</button>
                <span class="time-controls" style="display: flex; align-items: center; margin-left: 15px;">
                    <span style="font-weight: bold; margin-right: 5px;">Jump to:</span>
                    <button class="btn" onclick="jumpToTime(0)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">0%</button>
                    <button class="btn" onclick="jumpToTime(0.25)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">25%</button>
                    <button class="btn" onclick="jumpToTime(0.5)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">50%</button>
                    <button class="btn" onclick="jumpToTime(0.75)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">75%</button>
                    <button class="btn" onclick="jumpToTime(1.0)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">100%</button>
                </span>
            </div>
        `;
        
        let videoContent = "";

        if (isStillness) {
            // Layout for stillness evaluation (2 videos only)
            let stillnessWidth = obj_width; // Bigger than obj_width (570)
            videoContent = `<div class="video-row" style="display: flex; justify-content: space-between; width: 95%; margin: 0 auto;">`;
            for(let i = 0; i < 2; i++){
                videoContent += `
                    <div class="input-object" style="width: 47%; margin-bottom: 10px;">
                        ${generateElements(data_list[videoDataIndex]['data'][i]['url'], stillnessWidth, element_type)}
                        <div class="titles">${obj_title} ${i+1}</div>
                    </div>
                `;
            }
            videoContent += `</div>`;
        } else {
            // Layout for comparison (4 videos in 2x2)
            let firstRowVideos = "";
            let secondRowVideos = "";
            
            for(let i = 0; i < Math.min(2, num_of_selection); i++){
                firstRowVideos += `
                    <div class="input-object" style="width: ${obj_width}px;">
                        ${generateElements(data_list[videoDataIndex]['data'][i]['url'], obj_width, element_type)}
                        <div class="titles">${obj_title} ${i+1}</div>
                    </div>
                `;
            }
            
            for(let i = 2; i < num_of_selection; i++){
                secondRowVideos += `
                    <div class="input-object" style="width: ${obj_width}px;">
                        ${generateElements(data_list[videoDataIndex]['data'][i]['url'], obj_width, element_type)}
                        <div class="titles">${obj_title} ${i+1}</div>
                    </div>
                `;
            }

            videoContent = `
                <div class="video-row" style="margin-bottom: 20px;">
                    ${firstRowVideos}
                </div>
                <div class="video-row">
                    ${secondRowVideos}
                </div>
            `;
        }

        let txt = `
            <div>
                ${controlButtons}
                ${videoContent}
            </div>
        `;

        document.getElementById("images").innerHTML = txt;
        let comparisonPages = num_comparison_pages; // Your 7 comparison pages  
        let stillnessPages = num_stillness_pages;  // Your 4 stillness pages
        let totalVideoPages = comparisonPages + stillnessPages;

        if (now >= 2 && now <= comparisonPages + 1) {
            // Comparison pages (now 2-8 → display as 1-7)
            document.getElementById("num_page").innerHTML = `Comparison ${now-1}/${comparisonPages}`;
        } else if (now > comparisonPages + 1) {
            // Stillness pages (now 9-12 → display as 1-4) 
            let stillnessPageNum = now - comparisonPages - 1;
            document.getElementById("num_page").innerHTML = `Stillness ${stillnessPageNum}/${stillnessPages}`;
        }
        
        setTimeout(initVideoSynchronization, 100);
    }
    
    // Control visibility and content based on current page
    if(now == 0 || now == 1) { // Hide questions on both username and instruction pages
        document.getElementById("question").style.visibility = "hidden";
        document.getElementById("num_page").style.visibility = "hidden";
    } else {
        // Set up the question section only for video pages
        document.getElementById("text_prompt").innerHTML = `Questions`;
        renderQuestions();
        document.getElementById("question").style.visibility = "visible";
        document.getElementById("num_page").style.visibility = "visible";
    }

    if(now == 0) { // Hide prev button only on first page
        document.getElementById("prev_button").style.visibility = "hidden";
    } else {
        document.getElementById("prev_button").style.visibility = "visible";
    }

    if(now == data_list.length-1) {
        document.getElementById("next_button").innerHTML = `SUBMIT`;
    } else {
        document.getElementById("next_button").innerHTML = `NEXT`;
    }
}



function renderQuestions() {
    if (now <= 1) {
        return;
    }
    
    let videoDataIndex = now; // Change this from now-1 to now
    let isStillness = data_list[videoDataIndex].type === "stillness";
    
    console.log("renderQuestions - now:", now, "videoDataIndex:", videoDataIndex, "isStillness:", isStillness);
    
    if (isStillness) {
        // Render comparison question (similar to regular comparison questions)
        let txt = `<div style="margin: 0; padding: 0;">
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">${stillness_question}</p>
                <div style="display: flex; align-items: center; flex-wrap: wrap;">`;

        // Two options: Video 1 and Video 2
        for(let v = 1; v <= 2; v++){
            txt +=`
                <div style="margin-right: 15px; display: flex; align-items: center;">
                    <input type="radio" id="s1v${v}" name="S1" value="${v}" class="radio-container" style="margin: 0 5px 0 0;"/>
                    <label for="s1v${v}" style="margin: 0;">Video ${v}</label>
                </div>
            `;
        } 

        txt +=`
                </div>
            </div>
        </div>`;
        document.getElementById("questions").innerHTML = txt;
    } else {
        // Original comparison questions
        let txt = `<div style="margin: 0; padding: 0;">`;

        for(let q = 1; q <= num_of_questions; q++) {
            txt += `
            <div style="margin-bottom: 10px;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">Q${q}. ${questions[q-1]}</p>
                <div style="display: flex; align-items: center; flex-wrap: wrap;">`;

            for(let v = 1; v <= num_of_selection; v++){
                txt +=`
                    <div style="margin-right: 15px; display: flex; align-items: center;">
                        <input type="radio" id="q${q}v${v}" name="Q${q}" value="${v}" class="radio-container" style="margin: 0 5px 0 0;"/>
                        <label for="q${q}v${v}" style="margin: 0;">Video ${v}</label>
                    </div>
                `;
            }

            txt +=`
                </div>
            </div>
            `;
        }
        
        txt += `</div>`;
        document.getElementById("questions").innerHTML = txt;
    }
}
