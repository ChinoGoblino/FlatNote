// Load songs from localStorage or initialize an empty array
let songs = JSON.parse(localStorage.getItem('songs')) || [];
let currentSong = null;
let mediaRecorder;
let audioChunks = [];
let playbackAudio = null;

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
document.getElementById('addSongBtn').addEventListener('click', addSong);
recordBtn.addEventListener('click', toggleRecording);
playPauseBtn.addEventListener('click', togglePlayPause);

// Initialize the song list on page load
updateSongList();
recordBtn.disabled = true;
playPauseBtn.disabled = true;

function addSong() {
    const title = prompt('Enter song title:');
    const lyrics = prompt('Enter song lyrics:');
    
    if (title && lyrics) {
        const song = {
            id: Date.now(),
            title: title,
            lyrics: lyrics,
            recordings: []
        };
        songs.push(song);
        saveSongs();
        updateSongList();
        alert('Song added successfully!');
    } else {
        alert('Title and lyrics are required to add a song.');
    }
}

function updateSongList() {
    songListElement.innerHTML = '';
    songs.forEach(song => {
        const li = document.createElement('li');
        li.textContent = song.title;
        li.addEventListener('click', () => selectSong(song));
        songListElement.appendChild(li);
    });
}

function selectSong(song) {
    currentSong = song;
    songTitleElement.textContent = song.title;
    lyricsElement.textContent = song.lyrics;
    updateDates();
    recordBtn.disabled = false;
    playPauseBtn.disabled = song.recordings.length === 0;
    setPlayPauseButtonState('play');
}

function toggleRecording() {
    if (!currentSong) return;

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordTextElement.textContent = 'Record';
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
                };

                mediaRecorder.start();
                recordTextElement.textContent = 'Stop Recording';
                alert('Recording started!');
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert(`Failed to access microphone: ${error.name}. Please check your microphone permissions in the browser settings.`);
            });
    }
}

function togglePlayPause() {
    if (!currentSong || currentSong.recordings.length === 0) return;

    if (playbackAudio && !playbackAudio.paused) {
        playbackAudio.pause();
        setPlayPauseButtonState('play');
    } else if (playbackAudio && playbackAudio.paused) {
        playbackAudio.play();
        setPlayPauseButtonState('pause');
    } else {
        playLatestRecording();
    }
}

function playLatestRecording() {
    const latestRecording = currentSong.recordings[currentSong.recordings.length - 1];
    playbackAudio = new Audio(latestRecording.data);
    playbackAudio.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Failed to play recording.');
    });
    setPlayPauseButtonState('pause');
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
    const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
    const reader = new FileReader();

    reader.onloadend = function() {
        const base64data = reader.result;
        // Replace the latest recording with the new one
        currentSong.recordings.push({
            data: base64data,
            date: new Date().toISOString()
        });
        saveSongs();
        updateDates();
        playPauseBtn.disabled = false;
        alert('Recording saved!');
    };

    reader.readAsDataURL(audioBlob);
}

function updateDates() {
    const firstRecorded = currentSong.recordings[0]?.date || 'N/A';
    const lastRecorded = currentSong.recordings[currentSong.recordings.length - 1]?.date || 'N/A';
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
    localStorage.setItem('songs', JSON.stringify(songs));
}
