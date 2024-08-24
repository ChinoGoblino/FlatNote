import * as musicMetadata from 'music-metadata-browser';
// Load songs from localStorage or initialize an empty array
let songs = JSON.parse(localStorage.getItem('songs')) || [];
let currentSong = null;
let mediaRecorder;
let audioChunks = [];

// DOM elements
const songListElement = document.getElementById('songList');
const songTitleElement = document.getElementById('songTitle');
const lyricsElement = document.getElementById('lyrics');
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');
const firstRecordedElement = document.getElementById('firstRecorded');
const lastRecordedElement = document.getElementById('lastRecorded');

// Event listeners
document.getElementById('uploadForm').addEventListener('submit', addSong);
recordBtn.addEventListener('click', toggleRecording);
playBtn.addEventListener('click', playRecording);

// Initialize the song list on page load
updateSongList();
recordBtn.disabled = true;
playBtn.disabled = true;

async function addSong(event) {
    songs = [];
    const fileInput = document.getElementById('mp3File');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file before uploading.');
        return;
    }

    if (file.type !== 'audio/mpeg') {
        alert('Please upload an MP3 file.');
        return;
    }

    // Create a song object that includes metadata
    const song = {
        file: file,
        metadata: {}
    };
    alert("Words");
    try {
        const arrayBuffer = await file.arrayBuffer();
        const metadata = await musicMetadata.parseBuffer(arrayBuffer, 'audio/mpeg');
        song.metadata.title = metadata.common.title || 'N/A';
        song.metadata.artist = metadata.common.artist || 'N/A';
        songs.push(song);
        saveSongs();
        updateSongList();
        alert('Song added successfully!');
    } catch (error) {
        console.log('Error reading metadata:', error);
        alert('Failed to read song metadata.');
    }
}

function updateSongList() {
    songListElement.innerHTML = '';

    songs.forEach(song => {
        const li = document.createElement('li');
        li.textContent = song.metadata.title || 'N/A';

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
    playBtn.disabled = song.recordings.length === 0;
}

function toggleRecording() {
    if (!currentSong) return;

    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordBtn.textContent = 'Record';
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = saveRecording;
                audioChunks = [];
                mediaRecorder.start();
                recordBtn.textContent = 'Stop Recording';
                alert('Recording started!');
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('Failed to access microphone. Please check your permissions.');
            });
    }
}

function saveRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = function() {
        const base64data = reader.result;
        currentSong.recordings.push({
            data: base64data,
            date: new Date().toISOString()
        });
        saveSongs();
        updateDates();
        playBtn.disabled = false;
        alert('Recording saved!');
    };
}

function playRecording() {
    if (currentSong && currentSong.recordings.length > 0) {
        const latestRecording = currentSong.recordings[currentSong.recordings.length - 1];
        const audio = new Audio(latestRecording.data);
        audio.play();
    } else {
        alert('No recording available to play.');
    }
}

function updateDates() {
    const firstRecorded = currentSong.recordings[0]?.date || 'N/A';
    const lastRecorded = currentSong.recordings[currentSong.recordings.length - 1]?.date || 'N/A';
    firstRecordedElement.textContent = firstRecorded;
    lastRecordedElement.textContent = lastRecorded;
}

function saveSongs() {
    const songsBase64 = songs.map(song => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            reader.onerror = function(error) {
                reject(error);
            };
            reader.readAsDataURL(song);
        });
    });

    Promise.all(songsBase64)
        .then(base64Songs => {
            localStorage.setItem('songs', JSON.stringify(base64Songs));
            console.log('Songs saved to localStorage');
        })
        .catch(error => {
            console.error('Error saving songs to localStorage:', error);
        });
}
