var jsmediatags = window.jsmediatags;

// Load songs from localStorage or initialize an empty array
let songs = JSON.parse(localStorage.getItem('songs')) || [];
let currentSong = null;
let mediaRecorder;
let audioChunks = [];
let playbackAudio = null;
let audioArray = [];

// DOM elements
const songListElement = document.getElementById('songList');
const songTitleElement = document.getElementById('songTitle');
const lyricsElement = document.getElementById('lyrics');
const recordBtn = document.getElementById('recordBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const recordTextElement = document.getElementById('recordText');
const firstRecordedElement = document.getElementById('firstRecorded');
const lastRecordedElement = document.getElementById('lastRecorded');

// Event listeners
recordBtn.addEventListener('click', toggleRecording);
playPauseBtn.addEventListener('click', togglePlayPause);

// Initialize the song list on page load
updateSongList();
recordBtn.disabled = true;
playPauseBtn.disabled = true;

document.getElementById('mp3File').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (!file) {
        alert('No file selected.');
        return;
    }
    
    // Create an audio element to get the duration of the file
    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener('loadedmetadata', function() {
        const duration = audio.duration; // Duration in seconds

        jsmediatags.read(file, {
            onSuccess: function(tag) {
                const tags = tag.tags;
                const song = {
                    title: tags.title || 'Unknown Title',
                    artist: tags.artist || 'Unknown Artist',
                    album: tags.album || 'Unknown Album',
                    year: tags.year || 'Unknown Year',
                    lyrics: tags.lyrics || "No lyrics found",
                    duration: duration.toFixed(0),  // Add duration to the song object
                    fileURL: URL.createObjectURL(file),
                };
                songs.push(song);
                audioArray.push(audio);
                saveSongs();
                updateSongList();
            },
            onError: function(error) {
                console.error('Error reading metadata:', error);
                alert('Failed to read metadata.');
            }
        });
    });
    
    // Load the audio file to trigger the 'loadedmetadata' event
    audio.load();
});


function updateSongList() {
    songListElement.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.textContent = song.title;
        li.addEventListener('click', () => selectSong(song, index));
        songListElement.appendChild(li);
    });
}

function selectSong(song, index) {
    playbackAudio = null;
    currentSong = song;
    songTitleElement.textContent = song.title + ' - ' + song.duration + " sec";
    lyricsElement.textContent = song.lyrics.lyrics;
    updateDates();
    recordBtn.disabled = false;
    playPauseBtn.disabled = song.fileURL ? false : true; // Enable play button if a file is uploaded
    setPlayPauseButtonState('play');
}

function toggleRecording() {
    if (!currentSong) return;

    console.log(currentSong.duration);

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
        saveRecording();
        playbackAudio.pause();
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];  // Clear the previous recordings

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    saveRecording();
                    clearTimeout(recordingTimeout);  // Clear any existing timeout
                };

                mediaRecorder.start();

                // Play the original song while recording
                playbackAudio = new Audio(currentSong.fileURL);
                playbackAudio.play().catch(error => {
                    console.error('Error playing audio:', error);
                    alert('Failed to play audio.');
                });
                recordTextElement.textContent = 'Stop Recording';

                // Stop recording after the duration of currentSong.duration (in seconds)
                recordingTimeout = setTimeout(() => {
                    stopRecording();
                    saveRecording();
                    playbackAudio.pause();
                }, parseInt(currentSong.duration) * 1000); // convert to milliseconds
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert(`Failed to access microphone: ${error.name}. Please check your microphone permissions in the browser settings.`);
            });
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordTextElement.textContent = 'Record';
        playbackAudio.pause();  // Ensure the original song stops when recording stops
    }
}

function togglePlayPause() {
    if (!currentSong) return;

    if (playbackAudio && !playbackAudio.paused) {
        playbackAudio.pause();
        setPlayPauseButtonState('play');
    } else if (playbackAudio && playbackAudio.paused) {
        playbackAudio.play();
        setPlayPauseButtonState('pause');
    } else {
        playLatestRecordingOrFile();
    }
}

function playLatestRecordingOrFile() {
    if (currentSong.recordings && currentSong.recordings.length > 0) {
        const lastRecording = currentSong.recordings[currentSong.recordings.length - 1].data;
        playbackAudio = new Audio(lastRecording);
        playbackAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('Failed to play audio.');
        });
        setPlayPauseButtonState('pause');
    } else {
        alert('No recording or file to play.');
    }
}

function setPlayPauseButtonState(state) {
    if (state === 'play') {
        playPauseBtn.classList.remove('pause');
        playPauseBtn.classList.add('play');
    } else if (state === 'pause') {
        playPauseBtn.classList.remove('play');
        playPauseBtn.classList.add('pause');
    }
}

function saveRecording() {
    playbackAudio = null;
    const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
    const reader = new FileReader();

    reader.onloadend = function() {
        const base64data = reader.result;
        // Save the new recording in the current song's recordings array
        if (!currentSong.recordings) {
            currentSong.recordings = [];
        }
        currentSong.recordings.push({
            data: base64data,
            date: new Date().toISOString()
        });
        saveSongs();
        updateDates();
        playPauseBtn.disabled = false;
    };

    reader.readAsDataURL(audioBlob);
}

function updateDates() {
    const firstRecorded = currentSong.recordings?.[0]?.date || 'N/A';
    const lastRecorded = currentSong.recordings?.[currentSong.recordings.length - 1]?.date || 'N/A';
    firstRecordedElement.textContent = firstRecorded !== 'N/A' ? formatDate(firstRecorded) : 'N/A';
    lastRecordedElement.textContent = lastRecorded !== 'N/A' ? formatDate(lastRecorded) : 'N/A';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const options = { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    };
    return date.toLocaleDateString('en-GB', options).replace(',', '');
}

function saveSongs() {
    setTimeout(() => {
        songs = removeDuplicateSongs();
        localStorage.setItem('songs', JSON.stringify(songs));
    }, 200);
}

function removeDuplicateSongs() {
    const seenTitles = new Set(); // To store unique song titles
    return songs.filter(song => {
        if (seenTitles.has(song.title)) {
            return false; // Duplicate found, filter it out
        } else {
            seenTitles.add(song.title); // Add unique title to the set
            return true; // Keep the song in the array
        }
    });
}