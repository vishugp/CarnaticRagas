# Carnatic Raga Identifier

## Current Task: Working on the Pitch Detector and assigning Notes based on Pitch
## Progress on Current Task:

### Using Autocorrelation Method for Pitch Detection

The **Autocorrelation Method** is a technique for determining the pitch (frequency) of periodic signals, such as musical notes or human voice frequencies. It works by measuring how similar a signal is to itself when it is shifted in time, helping to identify periodicity in itself!

#### Steps Involved:

1. **Signal Preprocessing**:  
   Before performing autocorrelation, the mean (DC offset) of the signal is removed to center it around zero. 
   This helps focus on the actual waveform rather than any constant bias.

2. **Autocorrelation Calculation**:  
   The autocorrelation function compares the signal with itself at various time delays. When the delay corresponds to the period of the signal, the autocorrelation value peaks, revealing the periodicity of the signal.

3. **First Peak Detection - Inverse of Pitch**:  
   After computing the autocorrelation, the first peak in the autocorrelation curve is identified using differentiation. This peak corresponds to the fundamental period of the signal. 
   The inverse of this period gives the pitch (frequency).

4. **Threshold Check**:  
   The algorithm ensures the peak is strong enough by checking it against a predefined threshold to avoid noise or weak signals being misinterpreted as pitch.

#### Visualization

In the figure below, the signal is autocorrelated with itself. The first peak corresponds to the fundamental frequency, which is inversely related to the pitch:

![Autocorrelation Process](/Pitch%20Detection/Notes/Acf_new.svg)
