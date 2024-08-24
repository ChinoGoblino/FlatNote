let songs = JSON.parse(localStorage.getItem('songs')) || [];

let currentSong = null;

let mediaRecorder;

let audioChunks = [];


document.getElementById('addSongBtn').addEventListener('click', addSong);

document.getElementById('recordBtn').addEventListener('click', toggleRecording);

document.getElementById('playBtn').addEventListener('click', playRecording);


function addSong() {

    const title = prompt('Enter song title:');

    const lyrics = prompt('Enter song lyrics:');

    if (title && lyrics) {

        const song = { id: Date.now(), title, lyrics, recordings: [] };

        songs.push(song);

        saveSongs();

        updateSongList();

    }

}


function updateSongList() {

    const songList = document.getElementById('songList');

    songList.innerHTML = '';

    songs.forEach(song => {

        const li = document.createElement('li');

        li.textContent = song.title;

        li.addEventListener('click', () => selectSong(song));

        songList.appendChild(li);

    });

}


function selectSong(song) {

    currentSong = song;

    document.getElementById('songTitle').textContent = song.title;

    document.getElementById('lyrics').textContent = song.lyrics;

    updateDates();

}


function toggleRecording() {

    if (!currentSong) return;


    if (mediaRecorder && mediaRecorder.state === 'recording') {

        mediaRecorder.stop();

        document.getElementById('recordBtn').textContent = 'Record';

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

                document.getElementById('recordBtn').textContent = 'Stop Recording';

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

    }

}


function playRecording() {

    if (currentSong && currentSong.recordings.length > 0) {

        const latestRecording = currentSong.recordings[currentSong.recordings.length - 1];

        const audio = new Audio(latestRecording.data);

        audio.play();

    }

}


function updateDates() {

    const firstRecorded = currentSong.recordings[0]?.date || 'N/A';

    const lastRecorded = currentSong.recordings[currentSong.recordings.length - 1]?.date || 'N/A';

    document.getElementById('firstRecorded').textContent = firstRecorded;

    document.getElementById('lastRecorded').textContent = lastRecorded;

}


function saveSongs() {

    localStorage.setItem('songs', JSON.stringify(songs));

}


// Initial load

updateSongList();
