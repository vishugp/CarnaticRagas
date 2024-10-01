import numpy as np
import sounddevice as sd

# Constants
SAMPLE_RATE = 44100  # Audio sample rate
BUF_SIZE = 2048      # Buffer size for processing
THRESHOLD = 0.01     # Threshold for RMS to filter low volume noise

# Note names
NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
pitches = [] 
def note_from_pitch(frequency):
    """Convert frequency to the nearest musical note."""
    note_num = 12 * (np.log2(frequency / 440.0))
    note_index = int(np.round(note_num)) + 69
    return note_index
    # return NOTE_STRINGS[note_index % 12]


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
    
    audio = indata[:, 0]  # Use the first channel for mono input
    volume_norm = np.linalg.norm(audio) * 10
    if volume_norm > THRESHOLD:

        pitch = detect_pitch(audio, SAMPLE_RATE)

        if pitch != -1 and pitch < 300:
            note = note_from_pitch(pitch)
            print(f"Pitch: {pitch:.2f} Hz, Note: {note}")
            pitches.append(pitch)
        else:
            pitches.append(None)
            # print("No pitch detected")


with sd.InputStream(callback=audio_callback, channels=1, samplerate=SAMPLE_RATE, blocksize=BUF_SIZE):
    print("Starting pitch detection...")
    sd.sleep(10000)  # Run for 10 seconds



