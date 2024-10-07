import numpy as np
import sounddevice as sd
import soundfile as sf
from scipy.stats import mode

# Constants
SAMPLE_RATE = 44100  # Audio sample rate
BUF_SIZE = 2048      # Buffer size for processing
THRESHOLD = 0.01     # Threshold for RMS to filter low volume noise
OUTPUT_FILE = 'test_audio.wav' 
CHANNELS = 1
audio_file = sf.SoundFile(OUTPUT_FILE, mode='w', samplerate=SAMPLE_RATE, channels=CHANNELS, subtype='PCM_16')


# Note names
NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
# Global variables for stream and audio file
stream = None  # To hold the audio stream
audio_file = None  # To hold the audio file handle
pitches = []  # Store detected pitches
def note_from_pitch(frequency):
    """Convert frequency to the nearest musical note."""
    note_num = 12 * (np.log2(frequency / 440.0))
    note_index = int(np.round(note_num)) + 69
    # return note_index
    return NOTE_STRINGS[note_index % 12]


def detect_pitch(audio, sample_rate):
    """Autocorrelation method to estimate pitch."""
    audio = audio - np.mean(audio)  # Remove DC offset
    corr = np.correlate(audio, audio, mode='full')
    corr = corr[len(corr) // 2:]

    
    d = np.diff(corr) # Finding the first peak in the autocorrelation
    start = np.where(d > 0)[0][0]  # The first positive slope

    peak = np.argmax(corr[start:]) + start
    if corr[peak] > THRESHOLD:
        T0 = peak
        return sample_rate / T0
    return -1

def audio_callback(indata, frames, time, status):
    """Process audio input in real-time."""
    if status:
        print(status)
    audio_file.write(indata)
    audio = indata[:, 0]  # Use the first channel for mono input
    volume_norm = np.linalg.norm(audio) * 10
    if volume_norm > THRESHOLD:

        pitch = detect_pitch(audio, SAMPLE_RATE)

        if pitch != -1 and pitch < SAMPLE_RATE/108:
            note = note_from_pitch(pitch)
            print(f"Pitch: {pitch:.2f} Hz, Note: {note}")
            pitches.append(pitch)
        else:
            pitches.append(None)
            # print("No pitch detected")



# Start pitch detection
def start_detection(_):
    global stream, audio_file
    if stream is None:
        audio_file = sf.SoundFile(OUTPUT_FILE, mode='w', samplerate=SAMPLE_RATE, channels=CHANNELS, subtype='PCM_16')
        stream = sd.InputStream(callback=audio_callback, channels=1, samplerate=SAMPLE_RATE, blocksize=BUF_SIZE)
        stream.start()
        print("Pitch detection started...")

# Stop pitch detection
def stop_detection(_):
    global stream, audio_file
    if stream is not None:
        stream.stop()
        stream.close()
        audio_file.close()
        stream = None
        audio_file = None
        print(f"Pitch detection stopped. Audio saved to {OUTPUT_FILE}")

        if pitches:
            sruti = mode(pitches).mode  # Determine the most common pitch
            print(f"Determined Sruti: {sruti:.2f} Hz")